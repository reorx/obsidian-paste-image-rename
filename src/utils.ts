export const DEBUG = !(process.env.BUILD_ENV === 'production')

export function debugLog(...args: any[]) {
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
		// Preserve the initial slash if there was one.
		if (parts[0] === '') newParts.unshift('')
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
