/** Pure policy helpers: no Obsidian runtime, filesystem, DOM, or clock required. */
export const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tif', 'tiff', 'avif'])

export function isExcludedPath(filePath: string, folders: string): boolean {
	const normalized = filePath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
	return folders.split(/\r?\n/).some(value => {
		const folder = value.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
		return folder !== '' && (normalized === folder || normalized.startsWith(folder + '/'))
	})
}

export function compileExtensionPattern(pattern: string): RegExp | null {
	const firstLine = pattern.split(/\r?\n/)[0].trim()
	return firstLine ? new RegExp(firstLine) : null
}

export function isTemporaryAttachment(filePath: string): boolean {
	return filePath.split('/').some(part => part.startsWith('.')) || /\.(tmp|part|crdownload)$/i.test(filePath)
}

export interface DuplicateOptions {
	dupNumberAtStart: boolean
	dupNumberDelimiter: string
	dupNumberAlways: boolean
	dupNumberWidth?: number
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function allocateName(desiredName: string, siblings: string[], currentName: string | undefined, options: DuplicateOptions): string {
	const dot = desiredName.lastIndexOf('.')
	const stem = desiredName.slice(0, dot)
	const extension = desiredName.slice(dot + 1)
	const delimiter = options.dupNumberDelimiter
	const numberPattern = options.dupNumberAtStart
		? `^(\\d+)${escapeRegex(delimiter)}${escapeRegex(stem)}\\.${escapeRegex(extension)}$`
		: `^${escapeRegex(stem)}${escapeRegex(delimiter)}(\\d+)\\.${escapeRegex(extension)}$`
	const numbered = new RegExp(numberPattern)
	// Keep an existing conforming name stable on repeated batches.
	if (currentName && (currentName === desiredName && !options.dupNumberAlways || numbered.test(currentName))) return currentName
	const otherNames = siblings.filter(name => name !== currentName)
	if (!otherNames.includes(desiredName) && !options.dupNumberAlways) return desiredName
	const numbers = otherNames.map(name => numbered.exec(name)).filter(Boolean)
		.map(match => match[1].replace(/^0+(?=\d)/, ''))
	const largest = numbers.reduce((max, value) => value.length > max.length || value.length === max.length && value > max ? value : max, '0')
	// Decimal-string arithmetic also handles imported counters above MAX_SAFE_INTEGER.
	const digits = largest.split('')
	let index = digits.length - 1
	while (index >= 0 && digits[index] === '9') { digits[index] = '0'; index-- }
	if (index < 0) digits.unshift('1')
	else digits[index] = String(Number(digits[index]) + 1)
	const next = digits.join('')
	const width = Number.isInteger(options.dupNumberWidth) ? Math.max(1, Math.min(12, options.dupNumberWidth)) : 1
	const number = String(next).padStart(width, '0')
	return options.dupNumberAtStart ? `${number}${delimiter}${stem}.${extension}` : `${stem}${delimiter}${number}.${extension}`
}

export function splitRelativeFilename(input: string): {directory: string, filename: string} {
	const segments = input.split('/')
	if (!input.trim() || input.startsWith('/') || input.includes('\\') || segments.some(part => !part || part === '.' || part === '..')) {
		throw new Error('Use a relative filename or subfolder path without empty, dot, or parent segments.')
	}
	const filename = segments.pop()
	if (filename.startsWith('.') || !filename.includes('.') || filename.endsWith('.')) throw new Error('A nonempty filename and extension are required.')
	if (/[\p{Cc}\\/:*?"<>|#[\]^]/u.test(filename) || /[. ]$/.test(filename) || /^(CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])(?:\.|$)/i.test(filename)) {
		throw new Error('The filename contains characters or a reserved name that is not safe across supported platforms.')
	}
	return {directory: segments.join('/'), filename}
}

/** Replace only a parsed embed's destination, retaining user alias/size/alt/title. */
export function updateEmbedDestination(original: string, generatedLink: string): string | null {
	const generated = generatedLink.replace(/^!/, '')
	const wiki = /^!\[\[([^|\]]+)(\|[^\]]*)?\]\]$/.exec(original)
	const newWiki = /^\[\[([^|\]]+)(?:\|[^\]]*)?\]\]$/.exec(generated)
	if (wiki && newWiki) return `![[${newWiki[1]}${wiki[2] || ''}]]`
	const markdown = /^!\[([^\]]*)\]\((<[^>]*>|(?:\\.|[^\s])*)(\s+(?:"[^"]*"|'[^']*'))?\)$/.exec(original)
	const newMarkdown = /^\[[^\]]*\]\((.*)\)$/.exec(generated)
	if (markdown && newMarkdown) return `![${markdown[1]}](${newMarkdown[1]}${markdown[3] || ''})`
	// Mixed syntax/configuration and unsupported grammar are left to Obsidian.
	return null
}

export type NameInputPosition = 'end' | 'start' | 'select'
export function nameInputSelection(position: NameInputPosition, length: number): [number, number] {
	if (position === 'start') return [0, 0]
	if (position === 'select') return [0, length]
	return [length, length]
}

export function headingBeforeReference(headings: readonly {heading: string, position: {start: {line: number}}}[], line?: number): string {
	if (line === undefined) return ''
	let nearest = '', nearestLine = -1
	for (const heading of headings) {
		const headingLine = heading.position.start.line
		if (headingLine <= line && headingLine > nearestLine) {
			nearest = heading.heading
			nearestLine = headingLine
		}
	}
	return nearest
}

export function uuidV4(randomBytes = globalThis.crypto.getRandomValues(new Uint8Array(16))): string {
	if (randomBytes.length !== 16) throw new Error('UUID generation requires 16 random bytes.')
	const bytes = new Uint8Array(randomBytes)
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
