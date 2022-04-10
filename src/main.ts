/* TODOs:
 * - [x] check name existence when saving
 * - [x] imageNameKey in frontmatter
 * - [x] after renaming, cursor should be placed after the image file link
 * - [ ] add context menu for renaming the link/file
 * - [ ] handle image insert from drag'n drop
 * - [ ] batch rename all pasted images in a file
 */
import {
  App, Plugin, PluginSettingTab, Setting, TFile, TAbstractFile,
  Modal, MarkdownView, Notice,
} from 'obsidian';
import * as path from 'path';

import { renderTemplate } from './template';
import { createElementTree, debugLog } from './utils';

interface PluginSettings {
	// {{imageNameKey}}-{{DATE:YYYYMMDD}}
	imageNamePattern: string
	dupNumberAtStart: boolean
	dupNumberDelimiter: string
	autoRename: boolean
	handleAllImages: boolean
}

const DEFAULT_SETTINGS: PluginSettings = {
	imageNamePattern: '{{fileName}}',
	dupNumberAtStart: false,
	dupNumberDelimiter: '-',
	autoRename: false,
	handleAllImages: false,
}

const PASTED_IMAGE_PREFIX = 'Pasted image '


export default class PasteImageRenamePlugin extends Plugin {
	settings: PluginSettings
	modals: ImageRenameModal[] = []

	async onload() {
		const pkg = require('../package.json')
		console.log(`Plugin loading: ${pkg.name} ${pkg.version}`)
		await this.loadSettings();

		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (!(file instanceof TFile))
					return
				const timeGapMs = (new Date().getTime()) - file.stat.ctime
				// if the pasted image is created more than 1 second ago, ignore it
				if (timeGapMs > 1000)
					return
				if (isPastedImage(file)) {
					debugLog('pasted image created', file)
					this.renameImage(file, this.settings.autoRename)
				} else {
					// handle drop images
					if (isImage(file) && this.settings.handleAllImages) {
						debugLog('image created', file)
						this.renameImage(file, this.settings.autoRename)
					}
				}
			})
		)
		// this.registerEvent(
		// 	this.app.workspace.on('editor-drop', (evt: DragEvent, editor: Editor, markdownView: MarkdownView) => {
		// 		console.log('editor-drop', evt.defaultPrevented, evt, editor)
		// 	})
		// )
		// this.registerEvent(
		// 	this.app.metadataCache.on('changed', (file: TFile, data: string, cache: CachedMetadata) => {
		// 		console.log('metadata changed', file, data, cache)
		// 	})
		// )

		// add settings tab
		this.addSettingTab(new SettingTab(this.app, this));

	}

	async renameImage(file: TFile, autoRename: boolean = false) {
		const { stem, newName, isMeaningful }= this.generateNewName(file)
		debugLog('generated newName:', newName, isMeaningful)

		if (!isMeaningful || !autoRename) {
			this.openRenameModal(file, isMeaningful ? stem : '')
			return
		}
		this.renameFile(file, newName)
	}

	async renameFile(file: TFile, newName: string) {
		// deduplicate name
		newName = await this.deduplicateNewName(newName, file)
		debugLog('deduplicated newName:', newName)
		const originName = path.basename(file.path)

		// file system operation
		const newPath = path.join(path.dirname(file.path), newName)
		try {
			await this.app.fileManager.renameFile(file, newPath)
		} catch (err) {
			new Notice(`Failed to rename ${newName}: ${err}`)
			throw err
		}

		// in case fileManager.renameFile may not update the internal link in the active file,
		// we manually replace by manipulating the editor
		const editor = this.getActiveEditor()
		if (!editor) {
			new Notice(`Failed to rename ${newName}: no active editor`)
			return
		}

		const cursor = editor.getCursor()
		const line = editor.getLine(cursor.line)
		// console.log('editor context', cursor, )
		const linkText = `[[${originName}]]`,
			newLinkText = `[[${newName}]]`;
		debugLog('replace text', linkText, newLinkText)
		editor.transaction({
			changes: [
				{
					from: {...cursor, ch: 0},
					to: {...cursor, ch: line.length},
					text: line.replace(linkText, newLinkText),
				}
			]
		})

		new Notice(`Renamed ${originName} to ${newName}`)
	}

	openRenameModal(file: TFile, newName: string) {
		const modal = new ImageRenameModal(this.app, file as TFile, newName, (confirmedName: string) => {
			this.renameFile(file, confirmedName)
		})
		this.modals.push(modal)
		modal.open()
	}

	// returns a new name for the input file, with extension
	generateNewName(file: TFile) {
		let imageNameKey = ''
		const activeFile = this.getActiveFile()
		if (activeFile) {
			const fileCache = this.app.metadataCache.getFileCache(activeFile)
			if (fileCache) {
				debugLog('frontmatter', fileCache.frontmatter)
				imageNameKey = fileCache.frontmatter?.imageNameKey || ''
			} else {
				console.warn('could not get file cache from active file', activeFile.name)
			}
		}

		const stem = renderTemplate(this.settings.imageNamePattern, {
			imageNameKey,
			fileName: activeFile.basename,
		})
		const meaninglessRegex = new RegExp(`[${this.settings.dupNumberDelimiter}\s]`, 'gm')

		return {
			stem,
			newName: stem + path.extname(file.path),
			isMeaningful: stem.replace(meaninglessRegex, '') !== '',
		}
	}

	async deduplicateNewName(newName: string, file: TFile) {
		// list files in dir
		const dir = path.dirname(file.path)
		const listed = await this.app.vault.adapter.list(dir)
		debugLog('sibling files', listed)

		const newNameObj = path.parse(newName)
		const delimiter = this.settings.dupNumberDelimiter
		let dupNameRegex
		if (this.settings.dupNumberAtStart) {
			dupNameRegex = new RegExp(
				`^(?<number>\\d+)${delimiter}(?<name>${newNameObj.name})${newNameObj.ext}$`)
		} else {
			dupNameRegex = new RegExp(
				`^(?<name>${newNameObj.name})${delimiter}(?<number>\\d+)${newNameObj.ext}$`)
		}
		debugLog('dupNameRegex', dupNameRegex)

		const dupNameNumbers: number[] = []
		let isNewNameExist = false
		for (let sibling of listed.files) {
			sibling = path.basename(sibling)
			if (sibling == newName) {
				isNewNameExist = true
				continue
			}

			// match dupNames
			const m = dupNameRegex.exec(sibling)
			if (!m) continue
			// parse int for m.groups.number
			dupNameNumbers.push(parseInt(m.groups.number))
		}

		if (isNewNameExist) {
			// get max number
			const newNumber = dupNameNumbers.length > 0 ? Math.max(...dupNameNumbers) + 1 : 1
			// change newName
			if (this.settings.dupNumberAtStart) {
				newName = `${newNumber}${delimiter}${newNameObj.name}${newNameObj.ext}`
			} else {
				newName = `${newNameObj.name}${delimiter}${newNumber}${newNameObj.ext}`
			}
		}

		return newName
	}

	getActiveFile() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView)
		const file = view?.file
		debugLog('active file', file?.path)
		return file
	}
	getActiveEditor() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView)
		return view?.editor
	}

	onunload() {
		this.modals.map(modal => modal.close())
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

function isPastedImage(file: TAbstractFile): boolean {
	if (file instanceof TFile) {
		if (file.name.startsWith(PASTED_IMAGE_PREFIX)) {
			return true
		}
	}
	return false
}

const IMAGE_EXTS = [
	'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg',
]

function isImage(file: TAbstractFile): boolean {
	if (file instanceof TFile) {
		if (IMAGE_EXTS.contains(path.extname(file.name).toLowerCase())) {
			return true
		}
	}
	return false
}

class ImageRenameModal extends Modal {
	src: TFile
	stem: string
	renameFunc: (path: string) => void

	constructor(app: App, src: TFile, stem: string, renameFunc: (path: string) => void) {
		super(app);
		this.src = src
		this.stem = stem
		this.renameFunc = renameFunc
	}

	onOpen() {
		this.containerEl.addClass('image-rename-modal')
		const { contentEl, titleEl } = this;
		titleEl.setText('Rename image')

		const imageContainer = contentEl.createDiv({
			cls: 'image-container',
		})
		imageContainer.createEl('img', {
			attr: {
				src: this.app.vault.getResourcePath(this.src),
			}
		})

		let stem = this.stem
		const ext = path.extname(this.src.path)
		const getNewName = (stem: string) => stem + ext
		const getNewPath = (stem: string) => path.join(path.dirname(this.src.path), getNewName(stem))

		const infoET = createElementTree(contentEl, {
			tag: 'ul',
			cls: 'info',
			children: [
				{
					tag: 'li',
					children: [
						{
							tag: 'span',
							text: 'Origin path',
						},
						{
							tag: 'span',
							text: this.src.path,
						}
					],
				},
				{
					tag: 'li',
					children: [
						{
							tag: 'span',
							text: 'New path',
						},
						{
							tag: 'span',
							text: getNewPath(stem),
						}
					],
				}
			]
		})

		const doRename = async () => {
			debugLog('doRename', stem)
			this.renameFunc(getNewName(stem))
		}

		const nameSetting = new Setting(contentEl)
			.setName('New name')
			.setDesc('templates: ')
			.addText(text => text
				.setValue(stem)
				.onChange(async (value) => {
					// TODO show input error
					// if (!value) {
					// }
					stem = value
					infoET.children[1].children[1].el.innerText = getNewPath(stem)
				}
				))
		const nameInputEl = nameSetting.controlEl.children[0] as HTMLInputElement
		nameInputEl.focus()
		nameInputEl.addEventListener('keydown', async (e) => {
			if (e.key === 'Enter') {
				e.preventDefault()
				doRename()
				this.close()
			}
		})

		new Setting(contentEl)
			.addButton(button => {
				button
					.setButtonText('Rename')
					.onClick(() => {
						doRename()
						this.close()
					})
			})
			.addButton(button => {
				button
					.setButtonText('Cancel')
					.onClick(() => { this.close() })
			})
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

const imageNamePatternDesc = `
The pattern indicates how the new name should be generated.

Available variables:
- {{imageNameKey}}: this variable is read from the markdown file's frontmatter, from the same key "imageNameKey".
- {{fileName}}: name of the active file, without ".md" extension.
- {{DATE:$FORMAT}}: use "$FORMAT" to format the current date, "$FORMAT" must be a Moment.js format string, e.g. {{DATE:YYYY-MM-DD}}.

Here are some examples from pattern to image names (repeat in sequence), variables: imageNameKey = "foo", fileName = "My note":
- {{imageNameKey}}: foo, foo-1, foo-2
- {{imageNameKey}}-{{DATE:YYYYMMDD}}: foo-20220408, foo-20220408-1, foo-20220408-2
- {{fileName}}: My note, My note-1, My note-2
`

class SettingTab extends PluginSettingTab {
	plugin: PasteImageRenamePlugin;

	constructor(app: App, plugin: PasteImageRenamePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Image name pattern')
			.setDesc(imageNamePatternDesc)
			.setClass('long-description-setting-item')
			.addText(text => text
				.setPlaceholder('{{imageNameKey}}')
				.setValue(this.plugin.settings.imageNamePattern)
				.onChange(async (value) => {
					this.plugin.settings.imageNamePattern = value;
					await this.plugin.saveSettings();
				}
			));

		new Setting(containerEl)
			.setName('Duplicate number at start (or end)')
			.setDesc(`If enabled, duplicate number will be added at the start as prefix for the image name, otherwise it will be added at the end as suffix for the image name.`)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.dupNumberAtStart)
				.onChange(async (value) => {
					this.plugin.settings.dupNumberAtStart = value
					await this.plugin.saveSettings()
				}
				))

		new Setting(containerEl)
			.setName('Duplicate number delimiter')
			.setDesc(`The delimiter to generate the number prefix/suffix for duplicated names. For example, if the value is "-", the suffix will be like "-1", "-2", "-3", and the prefix will be like "1-", "2-", "3-".`)
			.addText(text => text
				.setValue(this.plugin.settings.dupNumberDelimiter)
				.onChange(async (value) => {
					this.plugin.settings.dupNumberDelimiter = value;
					await this.plugin.saveSettings();
				}
			));


		new Setting(containerEl)
			.setName('Auto rename')
			.setDesc(`By default, the rename modal will always be shown to confirm before renaming, if this option is set, the image will be auto renamed after pasting.`)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoRename)
				.onChange(async (value) => {
					this.plugin.settings.autoRename = value;
					await this.plugin.saveSettings();
				}
			));

		new Setting(containerEl)
			.setName('Handle all images')
			.setDesc(`By default, the plugin only handles images that matches the "Pasted Image" pattern, if this option is set, the plugin will handle all images. This includes drag'n drop image, or any other image that is created in the valut.`)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.handleAllImages)
				.onChange(async (value) => {
					this.plugin.settings.handleAllImages = value;
					await this.plugin.saveSettings();
				}
			));
	}
}
