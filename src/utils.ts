import { App, Vault } from 'obsidian';
import Compressor from "compressorjs";

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

const filenameNotAllowedChars = /[^a-zA-Z0-9~`!@$&*()\-_=+{};'",<.>? ]/g

export const sanitizer = {
	filename(s: string): string {
		return s.replace(filenameNotAllowedChars, '').trim()
	},

	delimiter(s: string): string {
		s = this.filename(s)
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
	useMarkdownLinks?: boolean
}

interface VaultWithConfig extends Vault {
	config?: VaultConfig,
}

export function getVaultConfig(app: App): VaultConfig|null {
	const vault = app.vault as VaultWithConfig
	return vault.config
}

export function ConvertImage(file:Blob, fileName:string):Promise<File> {
    return new Promise((resolve, reject) => {
        let reader = new FileReader(); //读取file
        reader.readAsDataURL(file);
        reader.onloadend = function (e) {
            let image = new Image() //新建一个img标签（还没嵌入DOM节点)
            image.src = e.target.result.toString() //将图片的路径设成file路径
            image.onload = function () {
                let canvas = document.createElement('canvas'),
                    context = canvas.getContext('2d'),
                    imageWidth = image.width,    
                    imageHeight = image.height,
                    data = ''
                canvas.width = imageWidth
                canvas.height = imageHeight
 
                context.drawImage(image, 0, 0, imageWidth, imageHeight)
                data = canvas.toDataURL('image/jpeg')
                var newfile = dataURLtoFile(data, fileName + '.jpeg');
                resolve(newfile)
            }
        }
    })
}

function dataURLtoFile(dataurl:string, filename:string) { // base64转file对象
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });  //转成了jpeg格式
}

export function ImageCompressor(image:File,backType:string, quality:number):Promise<File|Blob> {
    return new Promise((resolve, reject) => {
        new Compressor(image, {
            quality: quality || 0.6,
            success(result) 
			{
                let file = new File([result], image.name, { type: image.type })
                if (!backType || backType == 'blob') {
                    resolve(result)
                } else if (backType == 'file') {
                    resolve(file)
                } else {
                    resolve(file)
				}
            },
            error(err) 
			{
                console.log('图片压缩失败---->>>>>', err)
                reject(err)
            }
        })
    })
}
