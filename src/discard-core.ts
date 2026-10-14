/** Exact insertion proof and recoverable discard choreography; no permanent-delete API. */
export interface InsertedReference {
	from: number
	to: number
	original: string
}

export function proveSingleInsertion(before: string, after: string, cursor: number, references: InsertedReference[]): InsertedReference | undefined {
	if (!Number.isInteger(cursor) || cursor < 0 || cursor > before.length || after.length <= before.length) return
	const length = after.length - before.length
	if (after.slice(0, cursor) !== before.slice(0, cursor) || after.slice(cursor + length) !== before.slice(cursor)) return
	const candidates = references.filter(reference => Number.isInteger(reference.from) && Number.isInteger(reference.to) && reference.from >= cursor && reference.to <= cursor + length && reference.to > reference.from && after.slice(reference.from, reference.to) === reference.original)
	if (candidates.length !== 1) return
	const reference = candidates[0]
	if (!/^\s*$/.test(after.slice(cursor, reference.from)) || !/^\s*$/.test(after.slice(reference.to, cursor + length))) return
	return {from: reference.from, to: reference.to, original: reference.original}
}

export function equalBytes(left: ArrayBuffer, right: ArrayBuffer): boolean {
	if (left.byteLength !== right.byteLength) return false
	const a = new Uint8Array(left), b = new Uint8Array(right)
	return a.every((value, index) => value === b[index])
}

export interface DiscardSnapshot extends InsertedReference { text: string }
export interface DiscardIO {
	/** Fresh ownership/reference/byte checks. Returns a synchronous epoch/identity guard. */
	preflight(expectedText: string): Promise<() => void>
	/** Must verify captured source/view/editor identities, lifecycle, and exact text. */
	assertSource(expectedText: string): void
	replace(from: number, to: number, replacement: string): void
	save(): Promise<void>
	readSource(): Promise<{text: string, assertCurrent: () => void}>
	/** Must call vault.trash(file, false) once, never a permanent-delete fallback. */
	trash(): Promise<void>
	/** Fresh physical absence check after successful trash, not only cached TFile state. */
	confirmTrashed(): Promise<void>
	/** Fresh identity/path/disk-byte proof; guard tracks attachment mutations, not source saves. */
	proveRetainedFile(): Promise<(() => void) | undefined>
}

export class DiscardFailure extends Error {
	constructor(message: string, public readonly fileRetained: boolean, public readonly linkRestored: boolean) { super(message) }
}

/** Link first, verified save second, recoverable trash last. Not a two-resource transaction. */
export async function discardInsertedAttachment(snapshot: DiscardSnapshot, io: DiscardIO): Promise<void> {
	const {text, from, to, original} = snapshot
	if (!Number.isInteger(from) || !Number.isInteger(to) || text.slice(from, to) !== original || from < 0 || to <= from || to > text.length) throw new Error('The captured insertion is invalid.')
	const after = text.slice(0, from) + text.slice(to)
	let edited = false, trashStarted = false, trashConfirmed = false
	try {
		const stable = await io.preflight(text)
		io.assertSource(text); stable()
		edited = true
		io.replace(from, to, '')
		io.assertSource(after)
		await io.save()
		io.assertSource(after)
		const saved = await io.readSource()
		if (saved.text !== after) throw new Error('The saved note does not match the expected link removal.')
		saved.assertCurrent()
		io.assertSource(after)
		const stillStable = await io.preflight(after)
		io.assertSource(after); stillStable()
		trashStarted = true
		await io.trash()
		await io.confirmTrashed()
		trashConfirmed = true
		io.assertSource(after)
	} catch (failure) {
		let retainedGuard = await io.proveRetainedFile().catch((): undefined => undefined)
		try { retainedGuard?.() } catch { retainedGuard = undefined }
		let restored = false
		// Never restore a reference to a file whose trash outcome is uncertain.
		// Compensation is one exact inverse span, only on a known matching document.
		if (edited && retainedGuard && !trashConfirmed) {
			try {
				io.assertSource(after)
				const disk = await io.readSource()
				if (disk.text !== after && disk.text !== text) throw new Error('Disk changed; compensation is unsafe.')
				io.assertSource(after)
				disk.assertCurrent()
				retainedGuard()
				io.replace(from, from, original)
				io.assertSource(text)
				retainedGuard()
				await io.save()
				io.assertSource(text)
				const restoredDisk = await io.readSource()
				restoredDisk.assertCurrent()
				retainedGuard()
				io.assertSource(text)
				restored = restoredDisk.text === text
			} catch { /* Keep partial outcome visible; never overwrite unrelated edits. */ }
		}
		let finalGuard = await io.proveRetainedFile().catch((): undefined => undefined)
		try { finalGuard?.() } catch { finalGuard = undefined }
		const finalRetained = Boolean(finalGuard)
		if (restored) { try { io.assertSource(text) } catch { restored = false } }
		const state = trashConfirmed ? 'Attachment was verified moved to trash, but the note changed afterward. Check the note and vault trash.' : finalRetained ? (restored || !edited ? 'Attachment retained; note unchanged or restored.' : 'Attachment retained, but its link could not be restored safely. Check the note.') : (trashStarted ? 'Attachment trash outcome is uncertain; no trash retry was attempted. Check the vault trash and note.' : 'The original attachment could not be verified at its captured path; trash was not attempted. Check the attachment and note.')
		throw new DiscardFailure(`${state} ${trashStarted ? 'Trash was attempted once. ' : ''}${String(failure)}`, finalRetained, restored)
	}
}

export interface GestureInput {
	trusted: boolean
	defaultPrevented: boolean
	fileCount: number
	source: object
	view: object
	editor: object
	before: string
	cursor: number
	selection: string
	clipboardBytes: Promise<ArrayBuffer>
}
export interface InsertionToken extends GestureInput {
	active: boolean
	created: Set<object>
	expires: number
}
/** Observe host insertion without taking over paste/drop. New gestures revoke old tokens. */
export class SingleInsertionTracker {
	private current?: InsertionToken
	constructor(private now: () => number = Date.now) {}
	begin(input: GestureInput): InsertionToken | undefined {
		this.cancel()
		if (!input.trusted || input.defaultPrevented || input.fileCount !== 1 || input.selection || !Number.isInteger(input.cursor) || input.cursor < 0 || input.cursor > input.before.length) return
		const clipboardBytes = Promise.resolve(input.clipboardBytes).then(bytes => bytes.byteLength <= 20_000_000 ? bytes.slice(0) : new ArrayBuffer(0), () => new ArrayBuffer(0))
		this.current = {...input, clipboardBytes, active: true, created: new Set(), expires: this.now() + 30_000}
		return this.current
	}
	created(file: object) {
		if (!this.current || !this.valid(this.current)) return
		this.current.created.add(file)
		if (this.current.created.size > 1) this.current.active = false
	}
	modified(file: object) { if (this.current?.created.has(file)) this.current.active = false }
	cancel() { if (this.current) this.current.active = false; this.current = undefined }
	valid(token: InsertionToken): boolean { return token === this.current && token.active && this.now() <= token.expires }
	async prove(token: InsertionToken, file: object, source: object, view: object, editor: object, indexedText: string, currentText: () => string, references: InsertedReference[], readNewBytes: () => Promise<ArrayBuffer>): Promise<DiscardSnapshot | undefined> {
		const valid = () => this.valid(token) && source === token.source && view === token.view && editor === token.editor && token.created.size === 1 && token.created.has(file) && currentText() === indexedText
		if (!valid()) return
		const insertion = proveSingleInsertion(token.before, indexedText, token.cursor, references)
		if (!insertion) return
		try {
			const original = await token.clipboardBytes
			if (!valid() || !original.byteLength || original.byteLength > 20_000_000) return
			const actual = await readNewBytes()
			if (!valid() || !equalBytes(original, actual)) return
			return {...insertion, text: indexedText}
		} catch { return undefined }
	}
}
