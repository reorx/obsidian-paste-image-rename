import {
  App,
  Vault,
} from 'obsidian';

export const DEBUG = !(process.env.BUILD_ENV === 'production')
if (DEBUG) console.log('DEBUG is enabled')

export function debugLog(...args: unknown[]) {
	if (DEBUG) {
		console.log((new Date()).toISOString().slice(11, 23), ...args)
	}
}

interface ElementTreeOptions extends DomElementInfo {
	tag: keyof HTMLElementTagNameMap
	children?: ElementTreeOptions[]
}

interface ElementTree {
	el: HTMLElement
	children: ElementTree[]
}

export function createElementTree(rootEl: HTMLElement, opts: ElementTreeOptions): ElementTree {
	const result: ElementTree = {
		el: rootEl.createEl(opts.tag, opts as DomElementInfo),
		children: [],
	}
	const children = opts.children || []
	for (const child of children) {
		result.children.push(createElementTree(result.el, child))
	}
	return result
}

export const path = {
	// Credit: @creationix/path.js
	join(...partSegments: string[]): string {
		// Split the inputs into a list of path commands.
		let parts: string[] = []
		for (let i = 0, l = partSegments.length; i < l; i++) {
			parts = parts.concat(partSegments[i].split('/'))
		}
		// Interpret the path commands to get the new resolved path.
		const newParts = []
		for (let i = 0, l = parts.length; i < l; i++) {
			const part = parts[i]
			// Remove leading and trailing slashes
			// Also remove "." segments
			if (!part || part === '.') continue
			// Push new path segments.
			else newParts.push(part)
		}
		// Obsidian paths are always relative to the vault, including its root.
		// Turn back into a single string path.
		return newParts.join('/')
	},

	// returns the last part of a path, e.g. 'foo.jpg'
	basename(fullpath: string): string {
		const sp = fullpath.split('/')
		return sp[sp.length - 1]
	},

	// return extension without dot, e.g. 'jpg'
	extension(fullpath: string): string {
		const positions = [...fullpath.matchAll(new RegExp('\\.', 'gi'))].map(a => a.index)
		return fullpath.slice(positions[positions.length - 1] + 1)
	},
}

// Preserve Unicode punctuation, emoji and combining marks. Strip cross-platform
// filesystem separators/control characters and Obsidian link delimiters.
const filenameNotAllowedChars = /[\p{Cc}\\/:*?"<>|#[\]^]/gu

export const sanitizer = {
	filename(s: string): string {
		return s.replace(filenameNotAllowedChars, '').trim().replace(/[. ]+$/g, '')
	},

	delimiter(s: string): string {
		s = s.replace(filenameNotAllowedChars, '')
		// use default '-' if no valid chars found
		if (!s) s = '-'
		return s
	}
}

// ref: https://stackoverflow.com/a/6969486/596206
export function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


interface CompositionState {
	lock: boolean
}

export function lockInputMethodComposition(el: HTMLInputElement): CompositionState {
	const state: CompositionState = {
		lock: false,
	}
	el.addEventListener('compositionstart', () => {
		state.lock = true
	})
	el.addEventListener('compositionend', () => {
		state.lock = false
	})
	return state
}


interface VaultConfig {
	alwaysUpdateLinks?: boolean
	useMarkdownLinks?: boolean
}

interface VaultWithConfig extends Vault {
	config?: VaultConfig,
}

export function getVaultConfig(app: App): VaultConfig|null {
	const vault = app.vault as VaultWithConfig
	return vault.config
}

export interface NameObj {
	name: string
	stem: string
	extension: string
}
