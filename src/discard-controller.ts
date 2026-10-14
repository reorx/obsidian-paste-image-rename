import { App, CachedMetadata, Editor, MarkdownView, TAbstractFile, TFile } from 'obsidian';
import { discardInsertedAttachment, DiscardSnapshot, equalBytes, InsertionToken, SingleInsertionTracker } from './discard-core';
import { assertNoAttachmentReference, DISCARD_RASTER_EXTENSIONS, hasRasterSignature } from './discard-policy';

export interface DiscardAction {
	execute?: () => Promise<void>
	reason?: string
	cancel: () => void
}
interface Proof { token: InsertionToken, file: TFile, path: string, mtime: number, size: number, source: TFile, sourcePath: string, view: MarkdownView, editor: Editor, snapshot: DiscardSnapshot, bytes: ArrayBuffer, cancelled: boolean }

export class DiscardController {
	private tracker = new SingleInsertionTracker()
	private token?: InsertionToken
	private sourcePaths = new WeakMap<InsertionToken, string>()
	private generation = 0
	private versions = new WeakMap<TAbstractFile, number>()
	private stopped = false
	constructor(private app: App, private sourceReason: (file: TFile) => string | undefined) {}
	changed(file?: TAbstractFile, created = false) {
		this.generation++
		if (!file) return
		this.versions.set(file, (this.versions.get(file) || 0) + 1)
		if (created) this.tracker.created(file)
		else this.tracker.modified(file)
	}
	stop() { this.stopped = true; this.tracker.cancel() }
	observe(event: ClipboardEvent | DragEvent, editor: Editor, view: MarkdownView) {
		this.tracker.cancel(); this.token = undefined
		const files = 'clipboardData' in event ? event.clipboardData?.files : event.dataTransfer?.files
		if (this.stopped || !event.isTrusted || event.defaultPrevented || !view?.file || view.editor !== editor || !files || files.length !== 1 || this.sourceReason(view.file)) return
		const file = files[0]
		if (!file.size || file.size > 20_000_000 || typeof file.arrayBuffer !== 'function' || typeof editor.posToOffset !== 'function' || typeof editor.getSelection !== 'function') return
		const before = editor.getValue()
		if (before.length > 2_000_000) return
		this.token = this.tracker.begin({trusted: event.isTrusted, defaultPrevented: event.defaultPrevented, fileCount: files.length, source: view.file, view, editor, before, cursor: editor.posToOffset(editor.getCursor()), selection: editor.getSelection(), clipboardBytes: file.arrayBuffer().catch(() => new ArrayBuffer(0))})
		if (this.token) this.sourcePaths.set(this.token, view.file.path)
	}
	async prepare(file: TFile, source: TFile, data?: string, cache?: CachedMetadata): Promise<DiscardAction> {
		const unavailable = (reason: string): DiscardAction => ({reason, cancel: () => {}})
		const token = this.token
		if (!token || !this.tracker.valid(token) || source !== token.source || source.path !== this.sourcePaths.get(token) || typeof data !== 'string' || !cache) return unavailable('Requires a verified single-file paste/drop within 30 seconds; reused, multi-file and background attachments cannot be deleted here.')
		if (!DISCARD_RASTER_EXTENSIONS.has(file.extension.toLowerCase()) || !/^[\w .-]+$/.test(file.name)) return unavailable('Discard currently supports verified raster images with simple filenames only.')
		const view = token.view as MarkdownView, editor = token.editor as Editor
		if (typeof view.save !== 'function' || typeof editor.transaction !== 'function' || typeof editor.offsetToPos !== 'function') return unavailable('This editor does not provide the required save/transaction APIs.')
		const sourcePath = this.sourcePaths.get(token)
		const path = file.path, mtime = file.stat.mtime, size = file.stat.size, version = this.versions.get(file)
		const references = [...(cache.embeds || []), ...(cache.links || [])].filter(ref => this.app.metadataCache.getFirstLinkpathDest(ref.link, source.path) === file && ref.position).map(ref => ({from: ref.position.start.offset, to: ref.position.end.offset, original: ref.original}))
		const snapshot = await this.tracker.prove(token, file, source, view, editor, data, () => editor.getValue(), references, () => this.app.vault.readBinary(file))
		const bytes = await token.clipboardBytes
		if (!snapshot || source.path !== sourcePath || this.app.vault.getAbstractFileByPath(sourcePath) !== source || !this.app.workspace.getLeavesOfType('markdown').some(leaf => leaf.view === view) || !this.tracker.valid(token) || editor.getValue() !== data || this.stopped || file.path !== path || file.stat.mtime !== mtime || file.stat.size !== size || this.versions.get(file) !== version || view.file !== source || view.editor !== editor) return unavailable('The new insertion, source snapshot or image bytes could not be verified. Nothing will be deleted.')
		const proof: Proof = {token, file, path, mtime, size, source, sourcePath, view, editor, snapshot, bytes, cancelled: false}
		let attempted = false
		return {cancel: () => {proof.cancelled = true}, execute: () => {
			if (attempted) return Promise.reject(new Error('Discard was already attempted. No automatic retry is allowed.'))
			attempted = true
			return this.discard(proof)
		}}
	}
	private assertSource(proof: Proof, text: string) {
		if (this.stopped || proof.cancelled || proof.source.path !== proof.sourcePath || !this.app.workspace.getLeavesOfType('markdown').some(leaf => leaf.view === proof.view) || proof.view.file !== proof.source || proof.view.editor !== proof.editor || this.app.vault.getAbstractFileByPath(proof.source.path) !== proof.source || proof.editor.getValue() !== text) throw new Error('The captured source/editor changed or the prompt closed.')
		const reason = this.sourceReason(proof.source)
		if (reason) throw new Error(reason)
	}
	private async retained(proof: Proof): Promise<(() => void) | undefined> {
		const {file, path, mtime, size} = proof, version = this.versions.get(file)
		const check = () => {
			if (this.app.vault.getAbstractFileByPath(path) !== file || file.path !== path || file.stat.mtime !== mtime || file.stat.size !== size || this.versions.get(file) !== version) throw new Error('The attachment identity or bytes changed.')
		}
		try {
			check()
			const physical = await this.app.vault.adapter.stat(path)
			if (!physical || physical.type !== 'file' || physical.size !== size || physical.mtime !== mtime || physical.size > 20_000_000) return
			const bytes = await this.app.vault.readBinary(file)
			check()
			const after = await this.app.vault.adapter.stat(path)
			if (!equalBytes(proof.bytes, bytes) || !after || after.type !== 'file' || after.size !== size || after.mtime !== mtime) return
			check(); return check
		} catch { return }
	}
	private async physicalFiles(): Promise<string[]> {
		const pending = [''], paths: string[] = []
		let folders = 0
		while (pending.length) {
			if (++folders > 2000) throw new Error('Vault has too many folders for discard verification.')
			const listed = await this.app.vault.adapter.list(pending.pop())
			for (const path of listed.files) { if (!/^(?:\.obsidian|\.trash|\.git)(?:\/|$)/.test(path)) paths.push(path) }
			for (const path of listed.folders) if (!/^(?:\.obsidian|\.trash|\.git)(?:\/|$)/.test(path)) pending.push(path)
			if (paths.length > 2000) throw new Error('Vault has too many physical files for discard verification.')
		}
		return paths.sort()
	}
	private async preflight(proof: Proof, expected: string): Promise<() => void> {
		this.assertSource(proof, expected)
		if (!this.tracker.valid(proof.token)) throw new Error('Discard proof expired or changed. It is valid only for 30 seconds after one trusted paste/drop.')
		const generation = this.generation, files = this.app.vault.getFiles()
		if (files.length > 2000) throw new Error('This vault exceeds the 2000-file discard verification limit.')
		const physical = await this.physicalFiles()
		const expectedPaths = files.map(file => file.path).sort()
		if (JSON.stringify(physical) !== JSON.stringify(expectedPaths)) throw new Error('Physical vault files differ from the indexed file list. Wait for indexing; unknown files cannot be ignored.')
		const editors = this.app.workspace.getLeavesOfType('markdown').map(leaf => { const view = leaf.view as MarkdownView; return {view, file:view.file, editor:view.editor, text:view.editor?.getValue()} })
		const records = files.map(file => ({file, path:file.path, mtime:file.stat.mtime, size:file.stat.size}))
		const stable = () => {
			this.assertSource(proof, expected)
			if (generation !== this.generation || !this.tracker.valid(proof.token)) throw new Error('The vault or insertion changed during verification.')
			const open = this.app.workspace.getLeavesOfType('markdown')
			if (open.length !== editors.length || editors.some(record => !open.some(leaf => leaf.view === record.view) || record.view.file !== record.file || record.view.editor !== record.editor || record.editor?.getValue() !== record.text)) throw new Error('An open editor changed during verification.')
			const current = this.app.vault.getFiles()
			if (current.length !== records.length || records.some(record => record.file.path !== record.path || record.file.stat.mtime !== record.mtime || record.file.stat.size !== record.size || this.app.vault.getAbstractFileByPath(record.path) !== record.file)) throw new Error('The vault file snapshot changed.')
		}
		const retained = await this.retained(proof)
		if (!retained) throw new Error('The original attachment could not be verified on disk.')
		stable()
		let totalBytes = 0
		for (const {file} of records) {
			const extension = file.extension.toLowerCase()
			const stat = await this.app.vault.adapter.stat(file.path)
			stable()
			if (!stat || stat.type !== 'file' || stat.size !== file.stat.size || stat.mtime !== file.stat.mtime) throw new Error(`Physical file changed or is not indexed: ${file.path}`)
			if (file.stat.size > 20_000_000 || (totalBytes += file.stat.size) > 200_000_000) throw new Error(`Vault content exceeds the bounded discard scan size: ${file.path}`)
			if (DISCARD_RASTER_EXTENSIONS.has(extension)) {
				const bytes = await this.app.vault.readBinary(file)
				stable()
				const after = await this.app.vault.adapter.stat(file.path)
				stable()
				if (!after || after.size !== stat.size || after.mtime !== stat.mtime) throw new Error(`Physical raster changed during read: ${file.path}`)
				if (!hasRasterSignature(bytes, extension)) throw new Error(`Unverified raster/container content blocks deletion: ${file.path}`)
				continue
			}
			if (extension !== 'md') throw new Error(`Unsupported container blocks deletion: ${file.path}`)
			const reason = this.sourceReason(file)
			if (reason) throw new Error(`${file.path}: ${reason}`)
			if (file.stat.size > 4_000_000) throw new Error(`Note is too large to verify: ${file.path}`)
			let text = await this.app.vault.read(file)
			const after = await this.app.vault.adapter.stat(file.path)
			stable()
			if (!after || after.size !== stat.size || after.mtime !== stat.mtime) throw new Error(`Physical note changed during read: ${file.path}`)
			for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
				const view = leaf.view as MarkdownView
				if (view.file === file && view.editor?.getValue() !== text) throw new Error(`Unsaved competing editor blocks deletion: ${file.path}`)
			}
			if (file === proof.source) {
				if (text !== expected) throw new Error('The source is not saved at the verified snapshot yet. Wait for saving and retry with a new paste.')
				if (expected === proof.snapshot.text) text = text.slice(0, proof.snapshot.from) + text.slice(proof.snapshot.to)
			}
			try { assertNoAttachmentReference(text, proof.file.name, target => this.app.metadataCache.getFirstLinkpathDest(target, file.path) === proof.file) }
			catch (error) { throw new Error(`${file.path}: ${error}`) }
		}
		if (JSON.stringify(await this.physicalFiles()) !== JSON.stringify(expectedPaths)) throw new Error('Physical vault contents changed during verification.')
		for (const record of records) {
			const stat = await this.app.vault.adapter.stat(record.path)
			if (!stat || stat.type !== 'file' || stat.size !== record.size || stat.mtime !== record.mtime) throw new Error(`Physical file changed before deletion: ${record.path}`)
			stable()
		}
		stable(); retained()
		return () => {stable(); retained()}
	}
	private async discard(proof: Proof) {
		await discardInsertedAttachment(proof.snapshot, {
			preflight: expected => this.preflight(proof, expected),
			assertSource: expected => this.assertSource(proof, expected),
			replace: (from, to, text) => proof.editor.transaction({changes:[{from:proof.editor.offsetToPos(from), to:proof.editor.offsetToPos(to), text}]}),
			save: () => proof.view.save(),
			readSource: async () => {
				const version = this.versions.get(proof.source), mtime = proof.source.stat.mtime
				const before = await this.app.vault.adapter.stat(proof.sourcePath)
				const text = await this.app.vault.read(proof.source)
				const after = await this.app.vault.adapter.stat(proof.sourcePath)
				if (!before || !after || before.size !== after.size || before.mtime !== after.mtime) throw new Error('Physical source changed during readback.')
				return {text, assertCurrent: () => {if (version !== this.versions.get(proof.source) || mtime !== proof.source.stat.mtime || this.app.vault.getAbstractFileByPath(proof.source.path) !== proof.source) throw new Error('The source changed during disk readback.')}}
			},
			trash: () => this.app.vault.trash(proof.file, false),
			confirmTrashed: async () => {if (await this.app.vault.adapter.exists(proof.path) || this.app.vault.getAbstractFileByPath(proof.path) === proof.file) throw new Error('The original attachment is still present or trash completion cannot be verified.')},
			proveRetainedFile: () => this.retained(proof),
		})
	}
}
