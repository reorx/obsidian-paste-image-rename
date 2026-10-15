import { App, CachedMetadata, MarkdownView, moment, parseYaml, ReferenceCache, requireApiVersion, TFile } from 'obsidian';
import { parser, GFM } from '@lezer/markdown';
import { allocateName, compileExtensionPattern, DuplicateOptions, IMAGE_EXTENSIONS, isExcludedPath, isTemporaryAttachment, splitRelativeFilename, uuidV4 } from './rename-core';
import { equalBytes } from './discard-core';
import { TemplateDate } from './template';
import { getVaultConfig } from './utils';

interface Settings extends DuplicateOptions { imageNamePattern: string, excludedFolders: string, excludeExtensionPattern: string }
export interface VaultRenameHost {
	app: App
	settings: Settings
	sourceProtectionReason(file: TFile): string | undefined
	generateNewName(file: TFile, source: TFile, now?: TemplateDate, uuid?: string): {newName: string, isMeaningful: boolean}
}
export interface VaultRenameRow {
	originalPath: string
	targetPath?: string
	proposals: {sourcePath: string, name?: string, reason?: string}[]
	reason?: string
}
export interface VaultRenameResult { renamed: string[], attempted?: string, attemptedTarget?: string, stopped?: string, cancelled: boolean }
interface FileRecord { file: TFile, path: string, mtime: number, size: number, text?: string, bytes?: ArrayBuffer, cache?: CachedMetadata, cacheJSON?: string }
interface Reference { from: number, to: number, original: string, link: string, target: TFile | null, kind: string, parts?: {before: string, destination: string, after: string} }
interface Note { record: FileRecord, refs: Reference[], observed: {link: string, target: TFile | null}[], protectedTargets: Map<TFile, string>, unknown?: string }
interface Snapshot { records: FileRecord[], folders: string[], notes: Note[], guard: () => void }
interface Operation { row: VaultRenameRow, file: TFile }
const MAX_FILES = 2000, MAX_BYTES = 200_000_000, MAX_NOTE = 2_000_000
const stale = (detail: string) => new Error(`Preview is stale: ${detail}. Close and preview again.`)
const directory = (path: string) => path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
const basename = (path: string) => path.slice(path.lastIndexOf('/') + 1)
const join = (folder: string, name: string) => folder ? folder + '/' + name : name
const lexical = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
const serialized = (value: unknown) => JSON.stringify(value)
const pathKey = (path: string) => path.normalize('NFC').toLowerCase()
const localLink = (link: string) => !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(link)
function decode(link: string): string {
	if (/&(?:#[xX]?[\da-fA-F]+|[a-zA-Z][a-zA-Z\d]+);/.test(link)) throw new Error('HTML-entity link syntax cannot be verified.')
	return decodeURIComponent(link.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, '$1'))
}
/** Only a destination may differ after a completed rename. Alias, size, label, title and fragment stay exact. */
function referenceParts(original: string): Reference['parts'] {
	const wiki = /^(!?\[\[)([^\]|#\r\n]+)([^\]\r\n]*\]\])$/.exec(original)
	if (wiki) return {before: wiki[1], destination: wiki[2], after: wiki[3]}
	const md = /^(!?\[(?:\\.|[^\]\\])*\]\()(<[^<>\r\n]*>|(?:\\.|[^()\s])+)((?:[ \t]+(?:"[^"]*"|'[^']*'))?\))$/.exec(original)
	if (!md) return
	const angle = md[2].startsWith('<'), raw = angle ? md[2].slice(1, -1) : md[2]
	const fragment = raw.indexOf('#'), destination = fragment < 0 ? raw : raw.slice(0, fragment), suffix = fragment < 0 ? '' : raw.slice(fragment)
	return {before: md[1] + (angle ? '<' : ''), destination, after: suffix + (angle ? '>' : '') + md[3]}
}
function metadataContext(cache: CachedMetadata) {
	// Positions move when core updates a previous link. Context values cannot.
	return serialized({frontmatter: cache.frontmatter && Object.fromEntries(Object.entries(cache.frontmatter).filter(([key]) => key !== 'position')), headings: cache.headings?.map(h => ({heading:h.heading, level:h.level}))})
}

/** One-shot immutable plan. It never edits notes itself and never reallocates on Apply. */
export class VaultImageRenamePlan {
	readonly rows: VaultRenameRow[] = []
	private original: Snapshot
	private operations: Operation[] = []
	private completed = new Map<TFile, string>()
	private epoch = 0
	private stopped = false
	private attempted = false
	private cleanup: (() => void)[] = []
	private settings: string
	private config: string
	private result: VaultRenameResult = {renamed: [], cancelled: false}
	private constructor(private host: VaultRenameHost, private unavailable: () => boolean) {
		this.settings = serialized(host.settings)
		this.config = serialized(getVaultConfig(host.app))
		const changed = () => { this.epoch++ }
		const refs = [host.app.vault.on('create',changed), host.app.vault.on('delete',changed), host.app.vault.on('modify',changed), host.app.vault.on('rename',changed)]
		for (const ref of refs) this.cleanup.push(() => host.app.vault.offref(ref))
		const cacheRef = host.app.metadataCache.on('changed', changed)
		this.cleanup.push(() => host.app.metadataCache.offref(cacheRef))
		if (typeof requireApiVersion === 'function' && requireApiVersion('1.1.1')) {
			const editorRef = host.app.workspace.on('editor-change', changed)
			this.cleanup.push(() => host.app.workspace.offref(editorRef))
		}
	}
	static async create(host: VaultRenameHost, unavailable: () => boolean = () => false): Promise<VaultImageRenamePlan> {
		if (typeof host.app.metadataCache.getFirstLinkpathDest !== 'function' || typeof host.app.workspace.getLeavesOfType !== 'function') throw new Error('This host cannot provide the reference/editor APIs needed to verify a whole-vault preview. Use a newer Obsidian version.')
		const plan = new VaultImageRenamePlan(host, unavailable)
		try { await plan.prepare(); return plan } catch (error) { plan.close(); throw error }
	}
	close() { this.stopped = true; for (const clean of this.cleanup.splice(0)) clean() }
	private active() {
		if (this.stopped || this.unavailable()) throw new Error('Cancelled. Remaining images were left unchanged.')
		if (serialized(this.host.settings) !== this.settings || serialized(getVaultConfig(this.host.app)) !== this.config) throw stale('settings changed')
		if (getVaultConfig(this.host.app)?.alwaysUpdateLinks !== true) throw new Error('Enable Obsidian’s Automatically update internal links setting and create a new preview. This command must verify that setting is enabled.')
	}
	private editors() {
		const {workspace} = this.host.app
		const active = workspace.getActiveViewOfType(MarkdownView)
		const views = new Set([active, ...workspace.getLeavesOfType('markdown').map(leaf => leaf.view as MarkdownView)])
		if ([...views].some(view => view?.file && (!view.editor || typeof view.editor.getValue !== 'function'))) throw new Error('An open Markdown view cannot be inspected safely. Close it or use an editable Markdown view, then preview again.')
		return [...views].filter(view => view?.file).map(view => ({view, file: view.file, editor: view.editor, text: view.editor.getValue()}))
	}
	private async capture(): Promise<Snapshot> {
		this.active()
		const {app} = this.host, epoch = this.epoch, editors = this.editors()
		const records: FileRecord[] = app.vault.getFiles().map(file => ({file, path:file.path, mtime:file.stat.mtime, size:file.stat.size})).sort((a,b) => lexical(a.path,b.path))
		if (records.length > MAX_FILES) throw new Error(`Preview cannot verify more than ${MAX_FILES} files. Nothing was renamed.`)
		if (records.some(r => !Number.isFinite(r.size) || !Number.isFinite(r.mtime) || r.size < 0)) throw new Error('File statistics are unavailable; a complete preview cannot be verified.')
		if (records.some(r => r.size > 20_000_000) || records.reduce((sum,r) => sum+r.size,0) > MAX_BYTES) throw new Error('Preview scan exceeds 200 MB total or 20 MB per file. Nothing else will be renamed.')
		const metadata = records.filter(r => r.file.extension.toLowerCase() === 'md').map(record => ({record, json: serialized(app.metadataCache.getFileCache(record.file))}))
		const notes: Note[] = []
		const guard = () => {
			this.active()
			if (epoch !== this.epoch) throw stale('the vault changed during verification')
			const current = app.vault.getFiles()
			if (current.length !== records.length || records.some(r => r.file.path !== r.path || app.vault.getAbstractFileByPath(r.path) !== r.file || r.file.stat.size !== r.size || r.file.stat.mtime !== r.mtime)) throw stale('a file changed during verification')
			const open = this.editors()
			if (open.length !== editors.length || editors.some(r => !open.some(o => o.view === r.view && o.file === r.file && o.editor === r.editor && o.text === r.text))) throw stale('an editor changed during verification')
			if (metadata.some(({record,json}) => serialized(app.metadataCache.getFileCache(record.file)) !== json)) throw stale('metadata changed during verification')
			if (notes?.some(note => [...note.refs,...note.observed].some(ref => app.metadataCache.getFirstLinkpathDest(ref.link.split('#')[0],note.record.path) !== ref.target))) throw stale('reference resolution changed during verification')
		}
		const inventory = async () => {
			const files: string[] = [], folders: string[] = [], pending = [''], visited = new Set<string>()
			while (pending.length) {
				if (folders.length > MAX_FILES) throw new Error('Preview folder limit exceeded; the complete vault must be verified.')
				const folder = pending.pop()
				if (visited.has(folder)) throw new Error('Duplicate/cyclic folder listing prevents a complete vault scan.')
				visited.add(folder)
				const listed = await app.vault.adapter.list(folder); guard()
				for (const path of listed.files) if (!isTemporaryAttachment(path)) files.push(path)
				for (const path of listed.folders) if (!isTemporaryAttachment(path)) { folders.push(path); pending.push(path) }
				if (files.length > MAX_FILES) throw new Error('Preview file limit exceeded; the complete vault must be verified.')
			}
			return {files:files.sort(lexical),folders:folders.sort(lexical)}
		}
		const physical = await inventory()
		if (serialized(physical.files) !== serialized(records.filter(r => !isTemporaryAttachment(r.path)).map(r => r.path))) throw stale('physical files do not match the indexed vault')
		let bytes = 0
		for (const record of records) {
			if ((bytes += record.size) > MAX_BYTES || record.size > 20_000_000) throw new Error('Preview scan exceeds 200 MB total or 20 MB per file. Nothing else will be renamed.')
			const before = await app.vault.adapter.stat(record.path); guard()
			if (!before || before.type !== 'file' || before.mtime !== record.mtime || before.size !== record.size) throw stale(`${record.path} differs on disk`)
			const extension = record.file.extension.toLowerCase()
			if (['md', 'canvas', 'excalidraw', 'svg'].includes(extension)) {
				record.text = await app.vault.read(record.file); guard()
				if (record.text.length > MAX_NOTE) throw new Error(`${record.path} exceeds the 2 million character note/container limit.`)
				if (editors.some(e => e.file === record.file && e.text !== record.text)) throw stale(`${record.path} has unsaved or inconsistent editor text`)
				if (extension === 'md') {
					const cache = app.metadataCache.getFileCache(record.file)
					if (!cache) throw stale(`metadata is unavailable for ${record.path}`)
					record.cacheJSON = serialized(cache)
					// Host metadata objects may be mutated in place; never retain them as a baseline.
					record.cache = JSON.parse(record.cacheJSON)
				}
			} else if (IMAGE_EXTENSIONS.has(extension)) { record.bytes = (await app.vault.readBinary(record.file)).slice(0); guard() }
			const after = await app.vault.adapter.stat(record.path); guard()
			if (!after || after.type !== 'file' || after.mtime !== record.mtime || after.size !== record.size) throw stale(`${record.path} changed on disk during verification`)
		}
		// Recheck disk inventory/statistics after later reads, including watcher-lag writes.
		if (serialized(await inventory()) !== serialized(physical)) throw stale('physical vault inventory changed during verification')
		for (const record of records) {
			const stat = await app.vault.adapter.stat(record.path); guard()
			if (!stat || stat.type !== 'file' || stat.mtime !== record.mtime || stat.size !== record.size) throw stale(`${record.path} changed on disk during verification`)
		}
		notes.push(...records.filter(r => r.cache).map(record => this.inspectNote(record)))
		guard()
		return {records, folders:physical.folders, notes, guard}
	}
	private inspectNote(record: FileRecord): Note {
		const {text, cache} = record, refs: Reference[] = [], protectedTargets = new Map<TFile,string>()
		const note: Note = {record, refs, observed:[], protectedTargets}
		const lineAt = (offset: number) => text.slice(0,offset).split('\n').length-1
		const frontStart = /^(?:\uFEFF)?---[ \t]*\r?\n/.test(text)
		const frontEnd = frontStart ? (/^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)^(?:---|\.\.\.)[ \t]*\r?$/m.exec(text)?.[0].length || text.length) : 0
		const resolve = (link: string) => this.host.app.metadataCache.getFirstLinkpathDest(link.split('#')[0], record.path)
		const protect = (target: TFile | null, reason: string) => { if (target && IMAGE_EXTENSIONS.has(target.extension.toLowerCase())) protectedTargets.set(target, reason) }
		for (const [kind, values] of [['link',cache.links || []], ['embed',cache.embeds || []]] as [string, ReferenceCache[]][]) {
			for (const ref of values) {
				const from = ref.position?.start.offset, to = ref.position?.end.offset
				if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to <= from || text.slice(from,to) !== ref.original || ref.position.start.line !== lineAt(from)) throw stale(`reference metadata does not match ${record.path}`)
				const target = resolve(ref.link), parts = referenceParts(ref.original)
				refs.push({from,to,original:ref.original,link:ref.link,target,kind,parts})
				if (!parts) protect(target, `Unsupported reference syntax in ${record.path}`)
				else {
					try { if (resolve(decode(parts.destination)) !== target) throw new Error('destination mismatch') }
					catch { protect(target, `Ambiguous reference destination in ${record.path}`) }
				}
			}
		}
		refs.sort((a,b) => a.from-b.from)
		if (refs.some((ref,i) => i && ref.from < refs[i-1].to)) throw stale(`overlapping reference metadata in ${record.path}`)
		const check = (link: string, from: number, to: number) => {
			try {
				if (!localLink(link)) {
					if (/^(?:file|obsidian|app):/i.test(link)) note.unknown = `Unsupported local URI reference in ${record.path}`
					return
				}
				const destination = decode(link).split('|')[0].split('#')[0], target = resolve(destination)
				note.observed.push({link:destination,target})
				if (!refs.some(ref => ref.from <= from && ref.to >= to && ref.target === target)) {
					if (target) protect(target, `Unindexed or unsupported reference in ${record.path}`)
					else note.unknown = `Unindexed local reference in ${record.path}`
				}
			} catch { note.unknown = `Unverifiable link syntax in ${record.path}` }
		}
		// Reconcile real text with cache, including link-only and extensionless wiki references.
		const wiki = /!?\[\[([^[[\]\r\n]+)\]\]/g
		let match: RegExpExecArray | null
		while ((match = wiki.exec(text))) check(match[1], match.index, match.index+match[0].length)
		if (/\[\[|\]\]/.test(text.replace(wiki,''))) note.unknown = `Ambiguous wiki syntax in ${record.path}`
		const headings: {heading: string, level: number, line: number}[] = []
		parser.configure(GFM).parse(text).iterate({enter(node) {
			const heading = /^(ATX|Setext)Heading([1-6])$/.exec(node.name)
			if (heading && node.from >= frontEnd) {
				const raw = text.slice(node.from,node.to)
				headings.push({heading: (heading[1] === 'ATX' ? raw.replace(/^#{1,6}(?:[ \t]+|$)/,'').replace(/[ \t]+#+[ \t]*$/,'') : raw.replace(/\r?\n[ \t]*[=-]+[ \t]*$/,'')).trim(), level:Number(heading[2]), line:lineAt(node.from)})
			}
			if (node.name === 'URL') {
				const raw = text.slice(node.from,node.to)
				check(raw.startsWith('<') ? raw.slice(1,-1) : raw,node.from,node.to)
			}
			// HTML/plugin references are not covered by Markdown's metadata contract.
			if (['HTMLTag','HTMLBlock'].includes(node.name)) note.unknown = `Unsupported HTML reference container in ${record.path}`
			if (['FencedCode','CodeBlock'].includes(node.name)) note.unknown = `Unsupported code/plugin reference container in ${record.path}`
			if (node.name === 'InlineCode' && /^`+\s*\$?=/.test(text.slice(node.from,node.to))) note.unknown = `Unsupported dynamic inline reference in ${record.path}`
		}})
		if (serialized(headings) !== serialized((cache.headings || []).map(h => ({heading:h.heading, level:h.level, line:h.position.start.line})))) throw stale(`heading metadata does not match ${record.path}`)
		for (const ref of cache.frontmatterLinks || []) { const target = resolve(ref.link); note.observed.push({link:ref.link,target}); protect(target, `Frontmatter reference in ${record.path}`) }
		const front = /^(?:\uFEFF)?---[ \t]*\r?\n/.exec(text)
		if (front) {
			const match = /^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)^(?:---|\.\.\.)[ \t]*\r?$/m.exec(text)
			try {
				if (!match) throw new Error('unclosed frontmatter')
				const data = parseYaml(match[1]), seen = new Set<object>()
				const keys = (value: unknown): unknown => value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'position').sort(([a],[b]) => lexical(a,b)).map(([key,v]) => [key,keys(v)])) : Array.isArray(value) ? value.map(keys) : value
				if (serialized(keys(data || {})) !== serialized(keys(cache.frontmatter || {}))) throw stale(`frontmatter metadata does not match ${record.path}`)
				const inspect = (value: unknown, depth = 0) => {
					if (depth > 30) throw new Error('deep frontmatter')
					if (typeof value === 'string') { if (/[/]|\.(?:png|jpe?g|gif|bmp|webp|tiff?|avif|svg)(?:#.*)?$/i.test(value)) { const target = resolve(value); note.observed.push({link:value,target}); protect(target, `Frontmatter value in ${record.path}`) } return }
					if (value && typeof value === 'object') {
						if (seen.has(value)) throw new Error('aliased frontmatter')
						seen.add(value); for (const child of Object.values(value)) inspect(child, depth+1)
					}
				}
				inspect(data)
				if (data?.['excalidraw-plugin']) note.unknown = `Protected drawing container: ${record.path}`
			} catch (error) { note.unknown = `Unverifiable frontmatter in ${record.path}: ${String(error)}` }
		} else if (cache.frontmatter && Object.keys(cache.frontmatter).some(key => key !== 'position')) note.unknown = `Stale frontmatter metadata in ${record.path}`
		return note
	}
	private async prepare() {
		const now = moment(), snapshot = await this.capture()
		this.original = snapshot
		const extensionPattern = compileExtensionPattern(this.host.settings.excludeExtensionPattern)
		const blockers: string[] = snapshot.notes.map(n => n.unknown).filter(Boolean)
		const protectedTargets = new Map<TFile,string>()
		for (const note of snapshot.notes) for (const [target,reason] of note.protectedTargets) protectedTargets.set(target,reason)
		for (const record of snapshot.records) {
			const ext = record.file.extension.toLowerCase()
			if (ext === 'canvas') blockers.push(`Protected Canvas reference container: ${record.path}`)
			else if (ext === 'svg') blockers.push(`Unsupported SVG reference container: ${record.path}`)
			else if (!IMAGE_EXTENSIONS.has(ext) && ext !== 'md') blockers.push(`Unsupported reference container: ${record.path}`)
			if (/\.(?:excalidraw)(?:\.md)?$/i.test(record.path)) blockers.push(`Protected drawing container: ${record.path}`)
		}
		const occupied = new Set([...snapshot.records.map(r => r.path), ...snapshot.folders])
		for (const record of snapshot.records.filter(r => IMAGE_EXTENSIONS.has(r.file.extension.toLowerCase()))) {
			const row: VaultRenameRow = {originalPath:record.path, proposals:[]}; this.rows.push(row)
			const notes = snapshot.notes.filter(n => n.refs.some(ref => ref.target === record.file))
			let uuid: string
			for (const note of notes) {
				const sourcePath = note.record.path
				let reason = this.host.sourceProtectionReason(note.record.file)
				if (isExcludedPath(sourcePath,this.host.settings.excludedFolders)) reason = 'Referring note is in an excluded folder'
				try {
					// One shared UUID gives every source for one attachment the same random input.
					uuid = uuid || uuidV4()
					const generated = this.host.generateNewName(record.file,note.record.file,now,uuid)
					splitRelativeFilename(generated.newName)
					if (!generated.isMeaningful) reason = 'Generated filename is empty or not meaningful'
					row.proposals.push({sourcePath, name:generated.newName, reason})
				} catch (error) { row.proposals.push({sourcePath, reason:String(error)}) }
			}
			if (blockers.length) row.reason = blockers.join('; ')
			else if (protectedTargets.has(record.file)) row.reason = protectedTargets.get(record.file)
			else if (isTemporaryAttachment(record.path) || isExcludedPath(record.path,this.host.settings.excludedFolders) || extensionPattern?.test(record.file.extension)) row.reason = 'Image is excluded by path or extension settings'
			else if (!notes.length) row.reason = 'No verified Markdown links or embeds refer to this image'
			else if (row.proposals.some(p => p.reason)) row.reason = 'A referring note cannot safely participate; see source reasons'
			else if (new Set(row.proposals.map(p => p.name)).size !== 1) row.reason = 'Conflicting source filenames; no source takes precedence'
			if (row.reason) continue
			const folder = directory(record.path), siblings = [...occupied].filter(path => directory(path) === folder).map(basename)
			const namespace = (path: string) => pathKey(this.host.settings.dupNumberAcrossExtensions ? join(directory(path),basename(path).replace(/\.[^.]+$/, '')) : path)
			let name = allocateName(row.proposals[0].name,siblings,basename(record.path),this.host.settings)
			// Model conservative case-insensitive/NFC namespaces even on Linux.
			while ([...occupied].some(path => path !== record.path && namespace(path) === namespace(join(folder,name)))) {
				siblings.push(name)
				name = allocateName(row.proposals[0].name,siblings,undefined,this.host.settings)
			}
			splitRelativeFilename(name)
			row.targetPath = join(folder,name)
			if (row.targetPath !== row.originalPath && pathKey(row.targetPath) === pathKey(row.originalPath)) { row.reason = 'Case-only or Unicode-normalization-only renames are not safe across filesystems'; continue }
			if (row.targetPath === row.originalPath) { row.reason = 'Already has the collision-resolved filename'; continue }
			// New names must not bind unresolved links or shadow shorthand links to another file.
			if (this.wouldShadow(snapshot,record.file,name)) { row.reason = 'Destination could bind an unresolved reference or shadow a reference to another file'; continue }
			occupied.add(row.targetPath)
			this.operations.push({row,file:record.file})
		}
		snapshot.guard()
		for (const row of this.rows) { for (const proposal of row.proposals) Object.freeze(proposal); Object.freeze(row.proposals); Object.freeze(row) }
		Object.freeze(this.rows)
	}
	private wouldShadow(snapshot: Snapshot, target: TFile, name: string): boolean {
		const names = [name,name.slice(0,name.lastIndexOf('.'))].map(pathKey)
		return snapshot.notes.some(note => [...note.refs,...note.observed].some(ref => {
			if (ref.target === target || !localLink(ref.link)) return false
			try { return names.includes(pathKey(basename(decode(ref.link).split('#')[0]))) } catch { return true }
		}))
	}

	private canonical(note: Note, original: Note): string {
		if (note.refs.length !== original.refs.length) throw stale(`references changed in ${original.record.path}`)
		const pieces: string[] = []; let end = 0
		for (let i = 0; i < note.refs.length; i++) {
			const ref = note.refs[i], prior = original.refs[i]
			if (ref.kind !== prior.kind || ref.target !== prior.target) throw stale(`reference identity changed in ${original.record.path}`)
			pieces.push(note.record.text.slice(end,ref.from))
			if (this.completed.has(prior.target)) {
				if (!ref.parts || !prior.parts || ref.parts.before !== prior.parts.before || ref.parts.after !== prior.parts.after) throw stale(`reference decoration changed in ${original.record.path}`)
				pieces.push(prior.original)
			} else {
				if (ref.original !== prior.original || ref.link !== prior.link) throw stale(`an unrenamed reference changed in ${original.record.path}`)
				pieces.push(ref.original)
			}
			end = ref.to
		}
		pieces.push(note.record.text.slice(end))
		return pieces.join('')
	}
	private async verify(): Promise<() => void> {
		const snapshot = await this.capture(), original = this.original
		if (snapshot.records.length !== original.records.length || serialized(snapshot.folders) !== serialized(original.folders)) throw stale('vault inventory changed')
		for (const prior of original.records) {
			const current = snapshot.records.find(r => r.file === prior.file), expected = this.completed.get(prior.file) || prior.path
			if (!current || current.path !== expected) throw stale(`${prior.path} was moved, replaced or deleted`)
			if (prior.bytes && (!current.bytes || !equalBytes(prior.bytes,current.bytes))) throw stale(`image bytes changed: ${prior.path}`)
			if (!prior.cache && (current.mtime !== prior.mtime || current.size !== prior.size || current.text !== prior.text)) throw stale(`target or container changed: ${prior.path}`)
			if (prior.cache) {
				const note = snapshot.notes.find(n => n.record === current), previous = original.notes.find(n => n.record === prior)
				if (metadataContext(current.cache) !== metadataContext(prior.cache) || this.canonical(note,previous) !== prior.text) throw stale(`note content or naming context changed: ${prior.path}`)
				if (note.unknown !== previous.unknown || serialized([...note.protectedTargets].map(([file,reason]) => [original.records.findIndex(r => r.file === file),reason])) !== serialized([...previous.protectedTargets].map(([file,reason]) => [original.records.findIndex(r => r.file === file),reason]))) throw stale(`reference protection changed: ${prior.path}`)
				const reason = this.host.sourceProtectionReason(prior.file)
				if (reason && this.operations.some(op => op.row.proposals.some(p => p.sourcePath === prior.path))) throw stale(`${prior.path}: ${reason}`)
			}
		}
		for (const {row,file} of this.operations) if (!this.completed.has(file)) {
			if (this.wouldShadow(snapshot,file,basename(row.targetPath))) throw stale(`destination could shadow a reference after an earlier rename: ${row.targetPath}`)
			if (this.host.app.vault.getAbstractFileByPath(row.targetPath) || snapshot.records.some(r => r.path === row.targetPath) || snapshot.folders.includes(row.targetPath)) throw stale(`destination is occupied: ${row.targetPath}`)
		}
		snapshot.guard()
		return snapshot.guard
	}
	async apply(): Promise<VaultRenameResult> {
		if (this.attempted) return this.result
		this.attempted = true
		try {
			for (const operation of this.operations) {
				const guard = await this.verify()
				// No awaited work or name allocation between the final guard and mutation.
				guard()
				this.result.attempted = operation.row.originalPath
				this.result.attemptedTarget = operation.row.targetPath
				await this.host.app.fileManager.renameFile(operation.file,operation.row.targetPath)
				if (operation.file.path !== operation.row.targetPath || this.host.app.vault.getAbstractFileByPath(operation.row.targetPath) !== operation.file) throw new Error('The host returned without confirming the exact destination; the rename outcome is uncertain.')
				this.completed.set(operation.file,operation.row.targetPath)
				this.result.renamed.push(operation.row.targetPath)
				this.result.attempted = undefined
				this.result.attemptedTarget = undefined
			}
			if (this.operations.length) await this.verify()
		} catch (error) {
			this.result.cancelled = this.stopped || this.unavailable()
			this.result.stopped = String(error)
		} finally { this.close() }
		return this.result
	}
}
