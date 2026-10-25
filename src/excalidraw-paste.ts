import { parser, GFM } from '@lezer/markdown';
import { App, CachedMetadata, Editor, MarkdownView, parseYaml, TAbstractFile, TFile } from 'obsidian';
import { equalBytes, InsertionToken, SingleInsertionTracker } from './discard-core';
import { DISCARD_RASTER_EXTENSIONS, hasRasterSignature } from './discard-policy';

export interface ExcalidrawPasteProof {
	readonly source: TFile
	readonly file: TFile
	readonly sourcePath: string
	/** Revalidate the captured insertion only, without widening other drawing guards. */
	assertCurrent(): void
	cancel(): void
	/** Check current bytes and all indexed textual references; call the returned guard immediately before rename. */
	preflight(): Promise<() => void>
}

interface Body { from: number, to: number, suffix: string }
/** Deliberately support the standard, single commented Excalidraw data section only. */
export function excalidrawMarkdownBody(text: string): Body | undefined {
	if (text.length > 2_000_000) return
	const front = /^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)^(?:---|\.\.\.)[ \t]*\r?$/m.exec(text)
	if (!front || front.index !== 0 || front[1].length > 256_000) return
	let data: Record<string, unknown>
	try { data = parseYaml(front[1]) } catch { return }
	if (!data || !['parsed', 'locked'].includes(String(data['excalidraw-plugin'])) || data['allow-paste-image-rename'] !== true) return
	const markers = [...text.matchAll(/^%%[ \t]*\r?\n# Excalidraw Data[ \t]*\r?$/gm)]
	if (markers.length !== 1) return
	const to = markers[0].index, from = front[0].length
	if (to <= from || text.slice(from, to).includes('%%') || [...text.matchAll(/^# Excalidraw Data[ \t]*\r?$/gm)].length !== 1) return
	const suffix = text.slice(to)
	// No body after the final delimiter, no nested comments or ambiguous data sections.
	if (!/^%%[\s\S]*\r?\n%%[ \t]*(?:\r?\n)?$/.test(suffix) || [...suffix.matchAll(/%%/g)].length !== 2) return
	if ([...suffix.matchAll(/^## Drawing[ \t]*\r?$/gm)].length !== 1 || !/^## Drawing[ \t]*\r?\n```(?:compressed-json|json)[ \t]*\r?\n[\s\S]*?^```[ \t]*\r?\n%%[ \t]*(?:\r?\n)?$/m.test(suffix)) return
	return {from, to, suffix}
}

/** Bounded LZ-string Base64 decoder. Algorithm compatible with lz-string (MIT, Pieroxy).
 * Unlike an unbounded decode-then-check, limits apply while dictionary/output grow. */
export function decodeDrawing(input: string, limit = 4_000_000): string {
	const encoded = input.replace(/\s/g, '')
	if (!encoded || encoded.length > 500_000 || !/^[A-Za-z0-9+/]*={0,3}$/.test(encoded)) throw new Error('Invalid or oversized compressed drawing.')
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	let index = 0, mask = 32, value = alphabet.indexOf(encoded[0])
	const bits = (count: number) => {
		if (count > 24) throw new Error('Drawing dictionary exceeds the safety limit.')
		let result = 0
		for (let power = 1; power < 2 ** count; power *= 2) {
			if (index >= encoded.length || value < 0) throw new Error('Truncated compressed drawing.')
			if (value & mask) result += power
			mask >>= 1
			if (!mask) { mask = 32; value = alphabet.indexOf(encoded[++index]) }
		}
		return result
	}
	const initial = bits(2)
	if (initial === 2) return ''
	if (initial !== 0 && initial !== 1) throw new Error('Invalid compressed drawing header.')
	let previous = String.fromCharCode(bits(initial === 0 ? 8 : 16)), width = 3, enlarge = 4
	const dictionary: string[] = ['', '', '', previous], output = [previous]
	let length = previous.length, dictionaryLength = previous.length
	const add = (entry: string) => {
		dictionaryLength += entry.length
		if (dictionaryLength > limit * 4 || dictionary.length > 500_000) throw new Error('Drawing dictionary exceeds the safety limit.')
		dictionary.push(entry)
	}
	while (length <= limit) {
		let code = bits(width)
		if (code === 2) return output.join('')
		if (code === 0 || code === 1) { add(String.fromCharCode(bits(code === 0 ? 8 : 16))); code = dictionary.length - 1; enlarge-- }
		if (!enlarge) { enlarge = 2 ** width; width++ }
		const entry = dictionary[code] || (code === dictionary.length ? previous + previous[0] : undefined)
		if (entry === undefined) throw new Error('Invalid compressed drawing dictionary.')
		length += entry.length
		if (length > limit) throw new Error('Decoded drawing exceeds the safety limit.')
		output.push(entry); add(previous + entry[0]); enlarge--; previous = entry
		if (!enlarge) { enlarge = 2 ** width; width++ }
	}
	throw new Error('Decoded drawing exceeds the safety limit.')
}

function assertNoReference(text: string, name: string, resolves: (value: string) => boolean, extension: string): void {
	if (text.length > 4_000_000) throw new Error('A document is too large to verify shared drawing references.')
	const needle = name.normalize('NFC').toLowerCase()
	const inspectString = (value: string) => {
		const entities: Record<string, string> = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '}
		const decodedEntities = value.replace(/&(#(?:[xX][\da-fA-F]+|[0-9]+)|[a-zA-Z][a-zA-Z\d]+);/g, (_whole, entity: string) => {
			if (entity.startsWith('#')) {
				const number = entity[1].toLowerCase() === 'x' ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10)
				if (number <= 0 || number > 0x10ffff || (number >= 0xd800 && number <= 0xdfff)) throw new Error('Invalid numeric reference entity.')
				return String.fromCodePoint(number)
			}
			if (!(entity in entities)) throw new Error('Unsupported named HTML entity prevents reference verification.')
			return entities[entity]
		})
		const normalized = decodedEntities.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, '$1').replace(/(?:%[\da-fA-F]{2})+/g, encoded => {
			try { return decodeURIComponent(encoded) } catch { throw new Error('Invalid encoded reference prevents verification.') }
		}).normalize('NFC')
		if (normalized.toLowerCase().includes(needle)) throw new Error('This image is already mentioned or shared by another part of the vault.')
		if (/&(?:#[xX]?[\da-fA-F]+|[a-zA-Z][a-zA-Z\d]+);/.test(normalized)) throw new Error('Nested encoded HTML references cannot be verified safely.')
		if (resolves(normalized)) throw new Error('This image is already referenced elsewhere.')
		for (const match of normalized.matchAll(/!?\[\[([^\]\r\n]+)\]\]|\]\(([^\r\n)]+)\)/g)) {
			const target = (match[1] || match[2]).split('|')[0].split('#')[0].trim().replace(/^<|>$/g, '')
			if (resolves(target)) throw new Error('This image is already linked elsewhere.')
		}
		// Lezer covers titled Markdown destinations and reference definitions, which
		// cannot be safely recognized by a closing-parenthesis regular expression.
		parser.configure(GFM).parse(normalized).iterate({enter(node) {
			if (node.name !== 'URL') return
			const target = normalized.slice(node.from, node.to).replace(/^<|>$/g, '').split('#')[0]
			if (resolves(target)) throw new Error('This image is already linked elsewhere.')
			if (/^[a-z][a-z\d+.-]*:/i.test(target) && !/^(https?:|mailto:)/i.test(target)) throw new Error('Plugin/file URI references cannot be verified safely.')
		}})
	}
	const inspect = (value: unknown, depth = 0, seen = new Set<object>()) => {
		if (depth > 40) throw new Error('Reference data is too deeply nested to verify.')
		if (typeof value === 'string') { inspectString(value); return }
		if (!value || typeof value !== 'object') return
		if (seen.has(value)) throw new Error('Cyclic reference data cannot be verified.')
		seen.add(value)
		for (const [key, child] of Object.entries(value)) { inspectString(key); inspect(child, depth + 1, seen) }
		seen.delete(value)
	}
	inspectString(text)
	const front = /^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)^(?:---|\.\.\.)[ \t]*\r?$/m.exec(text)
	if (front) inspect(parseYaml(front[1]))
	else if (/^(?:\uFEFF)?---[ \t]*\r?\n/.test(text)) throw new Error('Unclosed frontmatter prevents reference verification.')
	if (extension === 'canvas' || extension === 'excalidraw') inspect(JSON.parse(text))
	const blocks = [...text.matchAll(/^```(compressed-json|json)[ \t]*\r?\n([\s\S]*?)^```[ \t]*\r?$/gm)]
	for (const block of blocks) {
		const decoded = block[1] === 'compressed-json' ? decodeDrawing(block[2]) : block[2]
		if (!decoded || decoded.length > 4_000_000) throw new Error('Drawing data cannot be decoded within the safety limit.')
		inspect(JSON.parse(decoded))
	}
	if (text.includes('```compressed-json') && !blocks.some(block => block[1] === 'compressed-json')) throw new Error('Malformed compressed drawing data prevents verification.')
}

export class ExcalidrawPasteController {
	private tracker = new SingleInsertionTracker()
	private token?: InsertionToken
	private sourcePath?: string
	private body?: Body
	private generation = 0
	private stopped = false
	constructor(private app: App, private resolve: (link: string, sourcePath: string) => TFile | null) {}
	private hasOpenDrawing(): boolean {
		return typeof this.app.workspace.getLeavesOfType !== 'function' || this.app.workspace.getLeavesOfType('excalidraw').length > 0 || this.app.workspace.getLeavesOfType('canvas').length > 0
	}
	created(file: TAbstractFile) { this.generation++; this.tracker.created(file) }
	modified(file?: TAbstractFile) { this.generation++; if (file) this.tracker.modified(file) }
	stop() { this.stopped = true; this.tracker.cancel() }
	observe(event: ClipboardEvent | DragEvent, editor: Editor, view: MarkdownView) {
		this.tracker.cancel(); this.token = undefined; this.body = undefined
		const files = 'clipboardData' in event ? event.clipboardData?.files : event.dataTransfer?.files
		if (typeof this.app.workspace.getActiveViewOfType !== 'function' || this.stopped || !(view instanceof MarkdownView) || !view.file || view.editor !== editor || this.app.workspace.getActiveViewOfType(MarkdownView) !== view || !event.isTrusted || event.defaultPrevented || files?.length !== 1) return
		if (typeof editor.posToOffset !== 'function' || typeof editor.getSelection !== 'function') return
		const image = files[0]
		if (!image.size || image.size > 20_000_000 || typeof image.arrayBuffer !== 'function') return
		const before = editor.getValue(), body = excalidrawMarkdownBody(before), cursor = editor.posToOffset(editor.getCursor())
		if (!body || cursor < body.from || cursor >= body.to || !/\.md$/i.test(view.file.path) || this.hasOpenDrawing()) return
		this.token = this.tracker.begin({trusted: true, defaultPrevented: false, fileCount: 1, source: view.file, view, editor, before, cursor, selection: editor.getSelection(), clipboardBytes: image.arrayBuffer()})
		if (this.token) { this.sourcePath = view.file.path; this.body = body }
	}
	canTrack(file: TFile, source: TFile): boolean {
		const token = this.token
		return !this.stopped && !!token && this.tracker.valid(token) && token.source === source && source.path === this.sourcePath && token.created.has(file) && token.created.size === 1 && DISCARD_RASTER_EXTENSIONS.has(file.extension.toLowerCase()) && /^[\w .-]+$/.test(file.name)
	}
	async prepare(file: TFile, source: TFile, data?: string, cache?: CachedMetadata): Promise<ExcalidrawPasteProof | undefined> {
		const token = this.token, beforeBody = this.body, sourcePath = this.sourcePath
		if (!token || !beforeBody || !sourcePath || !this.canTrack(file, source) || typeof data !== 'string' || !cache) return
		const view = token.view as MarkdownView, editor = token.editor as Editor
		const body = excalidrawMarkdownBody(data)
		if (!body || body.suffix !== beforeBody.suffix) return
		const refs = (cache.embeds || []).filter(ref => this.resolve(ref.link, sourcePath) === file && ref.position).map(ref => ({from: ref.position.start.offset, to: ref.position.end.offset, original: ref.original}))
		const snapshot = await this.tracker.prove(token, file, source, view, editor, data, () => editor.getValue(), refs, () => this.app.vault.readBinary(file))
		if (!snapshot || snapshot.from < body.from || snapshot.to > body.to) return
		let cancelled = false
		const path = file.path, mtime = file.stat.mtime, size = file.stat.size, bytes = await token.clipboardBytes
		if (!hasRasterSignature(bytes, file.extension)) return
		const assertCurrent = () => {
			if (cancelled || this.stopped || this.hasOpenDrawing() || !this.tracker.valid(token) || this.app.workspace.getActiveViewOfType(MarkdownView) !== view || view.file !== source || view.editor !== editor || source.path !== sourcePath || editor.getValue() !== data || this.app.vault.getAbstractFileByPath(sourcePath) !== source || file.path !== path || this.app.vault.getAbstractFileByPath(path) !== file || file.stat.mtime !== mtime || file.stat.size !== size) throw new Error('The Excalidraw insertion or its editor changed. Paste a new image to try again.')
			const current = excalidrawMarkdownBody(editor.getValue())
			if (!current || current.suffix !== beforeBody.suffix) throw new Error('Excalidraw drawing data changed.')
		}
		try { assertCurrent() } catch { return }
		return {source, file, sourcePath, assertCurrent, cancel: () => { cancelled = true }, preflight: async () => {
			assertCurrent()
			const generation = this.generation, records = this.app.vault.getFiles().map(item => ({file: item, path: item.path, mtime: item.stat.mtime, size: item.stat.size}))
			if (records.length > 10_000) throw new Error('Vault is too large for the bounded shared-image check.')
			const editors = this.app.workspace.getLeavesOfType('markdown').map(leaf => { const open = leaf.view as MarkdownView; return {view: open, file: open.file, editor: open.editor, text: open.editor?.getValue()} })
			const stable = () => {
				assertCurrent()
				if (generation !== this.generation) throw new Error('Vault changed during shared-image verification. Paste again after saving.')
				const current = this.app.vault.getFiles(), leaves = this.app.workspace.getLeavesOfType('markdown')
				if (current.length !== records.length || records.some(record => record.file.path !== record.path || record.file.stat.mtime !== record.mtime || record.file.stat.size !== record.size || this.app.vault.getAbstractFileByPath(record.path) !== record.file)) throw new Error('Indexed files changed during verification.')
				if (leaves.length !== editors.length || editors.some(record => !leaves.some(leaf => leaf.view === record.view) || record.view.file !== record.file || record.view.editor !== record.editor || record.editor?.getValue() !== record.text)) throw new Error('An open editor changed during verification.')
			}
			const physical = async (record: {path: string, mtime: number, size: number}) => {
				const stat = await this.app.vault.adapter.stat(record.path); stable()
				if (!stat || stat.type !== 'file' || stat.mtime !== record.mtime || stat.size !== record.size) throw new Error('Physical file changed or is not fully indexed: ' + record.path)
			}
			await physical({path, mtime, size})
			const actual = await this.app.vault.readBinary(file); stable()
			await physical({path, mtime, size})
			if (!equalBytes(bytes, actual)) throw new Error('Pasted image bytes changed.')
			let total = 0
			for (const record of records) {
				if (!['md', 'canvas', 'excalidraw', 'svg'].includes(record.file.extension.toLowerCase())) continue
				if (record.size > 4_000_000 || (total += record.size) > 50_000_000) throw new Error('Textual vault data exceeds the shared-image check limit.')
				await physical(record)
				let text = await this.app.vault.read(record.file); stable()
				await physical(record)
				const resolve = (target: string) => this.resolve(target, record.path) === file
				if (record.file === source) {
					if (text !== data) throw new Error('The source note is not saved at the verified insertion yet.')
					text = text.slice(0, snapshot.from) + text.slice(snapshot.to)
				}
				assertNoReference(text, file.name, resolve, record.file.extension.toLowerCase())
				for (const open of editors.filter(open => open.file === record.file && typeof open.text === 'string')) {
					let text = open.text
					if (record.file === source) {
						if (text !== data) throw new Error('Another source editor contains different text.')
						text = text.slice(0, snapshot.from) + text.slice(snapshot.to)
					}
					assertNoReference(text, file.name, resolve, record.file.extension.toLowerCase())
				}
			}
			for (const record of records) await physical(record)
			stable(); return stable
		}}
	}
}
