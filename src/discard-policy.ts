import { parser, GFM } from '@lezer/markdown';
import { parseYaml } from 'obsidian';

export const DISCARD_RASTER_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tif', 'tiff', 'avif'])

/** Conservative current-text ownership check. False positives refuse deletion. */
export function assertNoAttachmentReference(text: string, name: string, resolvesToAttachment: (target: string) => boolean): void {
	if (text.length > 2_000_000) throw new Error('A note exceeds the 2 million character ownership-check limit.')
	if (!/^[\w .-]+$/.test(name)) throw new Error('This attachment name is outside the verified discard syntax.')
	const normalized = (value: string): string => {
		if (/&(?:#[xX]?[\da-fA-F]+|[a-zA-Z][a-zA-Z\d]+);/.test(value)) throw new Error('HTML-entity reference syntax is not supported for deletion checks.')
		return value.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\\\]^_`{|}~])/g, '$1').replace(/(?:%[\da-fA-F]{2})+/g, encoded => {
			try { return decodeURIComponent(encoded) } catch { throw new Error('Invalid percent encoding prevents a complete reference check.') }
		}).normalize('NFC')
	}
	const checkString = (value: string) => {
		const decoded = normalized(value)
		if (decoded.toLowerCase().includes(name.toLowerCase())) throw new Error('Another mention or reference to this attachment exists.')
	}
	checkString(text)
	const front = /^(?:\uFEFF)?---[ \t]*\r?\n/.exec(text)
	let body = text
	if (front) {
		const match = /^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)^(?:---|\.\.\.)[ \t]*\r?$/m.exec(text)
		if (!match || match[1].length > 256_000) throw new Error('Unclosed or oversized frontmatter prevents a complete reference check.')
		let data: unknown
		try { data = parseYaml(match[1]) } catch { throw new Error('Invalid frontmatter prevents a complete reference check.') }
		if (data && typeof data === 'object' && (data as Record<string, unknown>)['excalidraw-plugin']) throw new Error('Excalidraw drawing containers are unsupported for deletion checks.')
		const seen = new Set<object>()
		const inspect = (value: unknown, depth = 0) => {
			if (depth > 30) throw new Error('Deep frontmatter prevents a complete reference check.')
			if (typeof value === 'string') { checkString(value); if (resolvesToAttachment(value)) throw new Error('A frontmatter value references this attachment.'); return }
			if (value && typeof value === 'object') {
				if (seen.has(value)) throw new Error('Aliased/cyclic frontmatter prevents a complete reference check.')
				seen.add(value)
				for (const child of Object.values(value)) inspect(child, depth + 1)
			}
		}
		inspect(data)
		body = text.slice(match[0].length)
	}
	if (/(^|[^\\])(?:\\\\)*(?:\$|%%)/.test(body)) throw new Error('Math/comment extension syntax is unsupported for deletion checks.')
	const wiki = /!?\[\[([^[\]\r\n]+)\]\]/g
	const masked = body.replace(wiki, (whole, inside: string) => {
		const target = normalized(inside.split('|')[0].split('#')[0].trim())
		if (resolvesToAttachment(target)) throw new Error('Another wiki reference to this attachment exists.')
		return ' '.repeat(whole.length)
	})
	if (masked.includes('[[') || masked.includes(']]')) throw new Error('Ambiguous wiki syntax prevents a complete reference check.')
	const tree = parser.configure(GFM).parse(body)
	tree.iterate({enter(node) {
		if (['HTMLBlock', 'HTMLTag', 'ProcessingInstruction', 'ProcessingInstructionBlock', 'CodeBlock', 'FencedCode', 'InlineCode'].includes(node.name)) throw new Error('HTML/code/plugin syntax is unsupported for deletion checks.')
		if (node.name !== 'URL') return
		let target = body.slice(node.from, node.to)
		if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1)
		target = normalized(target)
		if (/^(?:https?:|mailto:)/i.test(target)) return
		if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.includes('?')) throw new Error('URI/query reference syntax is unsupported for deletion checks.')
		if (resolvesToAttachment(target.split('#')[0])) throw new Error('Another Markdown reference to this attachment exists.')
	}})
}

/** Reject structured/text files merely renamed to an allowed raster extension. */
export function hasRasterSignature(bytes: ArrayBuffer, extension: string): boolean {
	const data = new Uint8Array(bytes), starts = (...values: number[]) => values.every((value, index) => data[index] === value)
	const ascii = (from: number, to: number) => String.fromCharCode(...data.slice(from, to))
	switch (extension.toLowerCase()) {
		case 'png': return starts(137,80,78,71,13,10,26,10)
		case 'jpg': case 'jpeg': return starts(255,216,255)
		case 'gif': return ['GIF87a','GIF89a'].includes(ascii(0,6))
		case 'bmp': return starts(66,77)
		case 'webp': return ascii(0,4) === 'RIFF' && ascii(8,12) === 'WEBP'
		case 'tif': case 'tiff': return starts(73,73,42,0) || starts(77,77,0,42) || starts(73,73,43,0) || starts(77,77,0,43)
		case 'avif': return ascii(4,8) === 'ftyp' && ['avif','avis'].includes(ascii(8,12))
		default: return false
	}
}
