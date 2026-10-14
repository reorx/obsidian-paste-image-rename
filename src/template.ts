import { FrontMatterCache } from 'obsidian';
import { uuidV4 } from './rename-core';

export interface TemplateDate {
	format(pattern: string): string
}

interface TemplateData {
	imageNameKey: string
	fileName: string
	dirName: string
	firstHeading: string
	attachmentName?: string
	fileExt?: string
	nearestHeading?: string
	uuid?: string
}

export const filenameSlug = (name: string, casing: 'lower' | 'preserve' = 'lower', separator: 'hyphen' | 'underscore' = 'hyphen'): string => {
	const trimmed = name.trim()
	return (casing === 'lower' ? trimmed.toLowerCase() : trimmed).replace(/\s+/gu, separator === 'underscore' ? '_' : '-')
}

/** Recognize the terminal extension using the same token boundaries as rendering. */
export function filenameTemplateStem(tmpl: string, rendered: string, extension: string): string {
	const tokens = /{{([^}]+)}}/g
	let token: RegExpExecArray | null
	while ((token = tokens.exec(tmpl)) !== null) {
		const tail = tmpl.slice(token.index + token[0].length)
		if (token[1] !== 'fileExt' || tmpl[token.index - 1] !== '.' || !/^\s*$/.test(tail)) continue
		const suffix = '.' + extension + tail
		return rendered.endsWith(suffix) ? rendered.slice(0, -suffix.length) : rendered
	}
	return rendered
}

export const renderTemplate = (tmpl: string, data: TemplateData, frontmatter?: FrontMatterCache, now: TemplateDate = window.moment()) => {
	let uuid: string | undefined
	// Interpret only tokens present in the pattern. Replacement values are data,
	// not additional template source (filenames can legitimately contain braces).
	return tmpl.replace(/{{([^}]+)}}/g, (match, token: string) => {
		const slug = /^(?:fileNameSlug|FileNameSlug):(lower|preserve):(hyphen|underscore)$/.exec(token)
		if (slug) return filenameSlug(data.fileName, slug[1] as 'lower' | 'preserve', slug[2] as 'hyphen' | 'underscore')
		if (token.startsWith('DATE:') && token.length > 5) return now.format(token.slice(5))
		if (token.startsWith('frontmatter:') && token.length > 12) {
			return frontmatter ? String(frontmatter[token.slice(12)] ?? '') : match
		}
		switch (token) {
			case 'imageNameKey': return String(data.imageNameKey)
			case 'fileName': return data.fileName
			case 'fileExt': return data.fileExt || ''
			case 'dirName': return data.dirName
			case 'firstHeading': return data.firstHeading
			case 'nearestHeading':
			case 'headerName': return data.nearestHeading || ''
			case 'UUID':
				uuid = uuid || data.uuid || uuidV4()
				return uuid
			case 'HEX':
				uuid = uuid || data.uuid || uuidV4()
				return uuid.replace(/-/g, '')
			case 'attachmentName':
			case 'originalAttachmentFileName': return data.attachmentName || ''
			case 'fileNameSlug':
			case 'FileNameSlug': return filenameSlug(data.fileName)
			default: return match
		}
	})
}
