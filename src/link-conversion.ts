import { parser, GFM } from '@lezer/markdown';
import { IMAGE_EXTENSIONS } from './rename-core';

export interface ConversionTarget { path: string, extension: string }
export interface ImageConversion {
	from: number
	to: number
	original: string
	replacement?: string
	target?: ConversionTarget
	targetPath?: string
	reason?: string
}
interface Range { from: number, to: number }

/** Conservative exclusions for Obsidian syntax beyond CommonMark. */
function opaqueRanges(text: string, protectedRanges: Range[], scanExclusions: Range[]): Range[] {
	const ranges: Range[] = [...protectedRanges]
	const front = /^(?:\uFEFF)?---[ \t]*\r?\n/.exec(text)
	if (front) {
		const close = /^(?:---|\.\.\.)[ \t]*\r?$/gm
		close.lastIndex = front[0].length
		const end = close.exec(text)
		ranges.push({from: 0, to: end ? end.index + end[0].length : text.length})
	}
	const base: Range[] = []
	if (ranges.length + scanExclusions.length > 10000) throw new Error('Too many protected regions to preview safely. Split the note before converting.')
	for (const range of [...ranges, ...scanExclusions].sort((left, right) => left.from - right.from)) {
		const previous = base[base.length - 1]
		if (previous && range.from <= previous.to) previous.to = Math.max(previous.to, range.to)
		else base.push({...range})
	}
	const protectedAt = (position: number) => {
		let low = 0, high = base.length - 1
		while (low <= high) {
			const middle = Math.floor((low + high) / 2), range = base[middle]
			if (position < range.from) high = middle - 1
			else if (position >= range.to) low = middle + 1
			else return range
		}
		return undefined
	}
	const escapedPositions = new Uint8Array(text.length)
	let precedingSlashes = 0
	for (let index = 0; index < text.length; index++) {
		escapedPositions[index] = precedingSlashes % 2
		precedingSlashes = text[index] === '\\' ? precedingSlashes + 1 : 0
	}
	const escaped = (position: number) => escapedPositions[position] === 1

	// Obsidian's comment/math grammar is not CommonMark. Once an actual opener
	// appears outside parsed literal/link content, protect the tail rather than
	// infer a closing delimiter and risk exposing embedded examples.
	for (let index = 0; index < text.length; index++) {
		const protectedRange = protectedAt(index)
		if (protectedRange) { index = protectedRange.to - 1; continue }
		if (escaped(index)) continue
		if (text.startsWith('%%', index) || text[index] === '$') {
			ranges.push({from: index, to: text.length})
			break
		}
	}

	return ranges
}

/** Plan against live text, never against cached Markdown positions. No mutations. */
export function planImageLinkConversion(text: string, resolve: (link: string) => ConversionTarget | null): ImageConversion[] {
	if (text.length > 2_000_000) throw new Error('This command supports notes up to 2 million characters. Split the note before converting.')
	const tree = parser.configure(GFM).parse(text)
	const base: Range[] = [], scanExclusions: Range[] = []
	tree.iterate({enter(node) {
		if (['Image', 'Link', 'LinkReference', 'Autolink', 'URL', 'LinkTitle', 'LinkLabel'].includes(node.name)) scanExclusions.push({from: node.from, to: node.to})
		if (['CodeBlock', 'FencedCode', 'InlineCode', 'HTMLBlock', 'HTMLTag', 'Comment', 'CommentBlock', 'ProcessingInstruction', 'ProcessingInstructionBlock'].includes(node.name)) {
			base.push({from: node.from, to: node.to})
		}
		if (node.name !== 'HTMLTag' && node.name !== 'HTMLBlock') return
		let parent = node.node.parent
		while (parent && parent.name !== 'Paragraph') parent = parent.parent
		if (parent) base.push({from: parent.from, to: parent.to})
		// Raw HTML wrappers can extend across blank lines beyond CommonMark nodes.
		// Do not infer their end from unparsed strings; conservatively protect the tail.
		if (/^\s*<[A-Za-z]/.test(text.slice(node.from, node.to))) base.push({from: node.from, to: text.length})
	}})
	const opaque = opaqueRanges(text, base, scanExclusions)
	opaque.sort((left, right) => left.from - right.from)
	const merged: Range[] = []
	for (const range of opaque) {
		const previous = merged[merged.length - 1]
		if (previous && range.from <= previous.to) previous.to = Math.max(previous.to, range.to)
		else merged.push({...range})
	}
	let opaqueIndex = 0
	const plan: ImageConversion[] = []
	tree.iterate({enter(node) {
		if (node.name !== 'Image') return
		const item: ImageConversion = {from: node.from, to: node.to, original: text.slice(node.from, node.to)}
		if (plan.length >= 1000) throw new Error('This preview supports up to 1000 image references. Split the note before converting.')
		plan.push(item)
		let parent = node.node.parent
		while (parent) {
			if (parent.name === 'Table' || parent.name === 'Link') { item.reason = 'Images inside tables or link labels are left unchanged'; return false }
			parent = parent.parent
		}
		while (opaqueIndex < merged.length && merged[opaqueIndex].to <= item.from) opaqueIndex++
		if (opaqueIndex < merged.length && item.to > merged[opaqueIndex].from) {
			item.reason = 'Protected frontmatter, comment, math or HTML context'
			return false
		}
		const match = /^!\[((?:\d+(?:x\d+)?)?)\]\((<[^<>\r\n]*>|[^()\s]+)\)$/.exec(item.original)
		if (!match) { item.reason = 'Only inline images with an empty label or numeric dimensions, without titles, are supported'; return false }
		const raw = match[2].startsWith('<') ? match[2].slice(1, -1) : match[2]
		if (/[\\&]/.test(raw)) { item.reason = 'Escaped or entity-containing targets are left unchanged'; return false }
		let link: string
		try { link = decodeURIComponent(raw) } catch { item.reason = 'Invalid URL encoding'; return false }
		if (!link || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(link) || /[?#\p{Cc}]/u.test(link)) {
			item.reason = 'Remote, fragment, query or unsupported target'; return false
		}
		const target = resolve(link)
		const rawTarget = raw === link ? target : resolve(raw)
		if (target && rawTarget && rawTarget !== target) { item.reason = 'Raw and decoded targets resolve to different files'; return false }
		if (!target || !IMAGE_EXTENSIONS.has(target.extension.toLowerCase())) { item.reason = 'Target is not a resolved local image'; return false }
		if (/[[\]|#^<>?%\\:\p{Cc}]/u.test(target.path)) { item.reason = 'Target cannot be represented safely as a wiki embed'; return false }
		item.target = target
		item.targetPath = target.path
		item.replacement = `![[${target.path}${match[1] ? '|' + match[1] : ''}]]`
		return false
	}})
	return plan
}
