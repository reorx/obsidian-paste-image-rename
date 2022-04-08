/* TODOs:
 * - [ ] check name existence when saving
 * - [ ] imageNameKey in frontmatter
 * - [ ] add context menu for renaming the link/file
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
	// {{imageNameKey}}-{{DATE:YYYY-MM-DD}}
	imageNamePattern: string
	dupNumberAtStart: boolean
	dupNumberDelimiter: string
	autoRename: boolean
}

// TODO two functions: rename, autoRename

const DEFAULT_SETTINGS: PluginSettings = {
	imageNamePattern: '{{imageNameKey}}-',
	dupNumberAtStart: false,
	dupNumberDelimiter: '-',
	autoRename: false,
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
				if (!isPastedImage(file))
					return
				const timeGapMs = (new Date().getTime()) - file.stat.ctime
				// if the pasted image is created more than 1 second ago, ignore it
				if (timeGapMs > 1000)
					return
				debugLog('pasted image created', file)
				this.renameImage(file, this.settings.autoRename)
			})
		)

		// add settings tab
		this.addSettingTab(new SettingTab(this.app, this));

		// debug code
		/*
		if (DEBUG) {
			var imageFile: TFile
			for (const file of this.app.vault.getFiles()) {
				if (isPastedImage(file)) {
					imageFile = file
					break
				}
			}
			if (imageFile) {
				const modal = new ImageRenameModal(this.app, imageFile as TFile)
				modal.open()
				this.modals.push(modal)
				this.renameImage(imageFile)
			}
		}
		*/
	}

	async renameImage(file: TFile, autoRename: boolean = false) {
		const { newName, isMeaningful }= this.generateNewName(file)
		debugLog('generated newName:', newName, isMeaningful)

		if (!isMeaningful || !autoRename) {
			this.openRenameModal(file, newName)
			return
		}

		const dedupedNewName = await this.deduplicateNewName(newName, file)
		debugLog('deduplicated newName:', dedupedNewName)
	}

	async renameFile(file: TFile, newPath: string) {
		const newName = path.basename(newPath)
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

		const linkText = `[[${file.basename}]]`,
			newLinkText = `[[${newName}]]`;
		editor.setValue(
			editor.getValue().replace(linkText, newLinkText)
		)

		new Notice(`Renamed ${file.name} to ${newName}`)
	}

	openRenameModal(file: TFile, newName: string) {
		const modal = new ImageRenameModal(this.app, file as TFile, newName, (filepath: string) => {
			this.renameFile(file, filepath)
		})
		this.modals.push(modal)
		modal.open()
	}

	// returns a new name for the input file, with extension
	generateNewName(file: TFile) {
		let imageNameKey = ''
		const activeFile = this.getActiveFile()
		if (activeFile) {
			debugLog('frontmatter', this.app.metadataCache.getFileCache(activeFile).frontmatter)
			imageNameKey = this.app.metadataCache.getFileCache(activeFile).frontmatter?.imageNameKey || ''
		}

		const stem = renderTemplate(this.settings.imageNamePattern, { imageNameKey })
		const meaninglessRegex = new RegExp(`[${this.settings.dupNumberDelimiter}\s]`, 'gm')

		return {
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

class ImageRenameModal extends Modal {
	src: TFile
	newName: string
	renameFunc: (path: string) => void

	constructor(app: App, src: TFile, newName: string, renameFunc: (path: string) => void) {
		super(app);
		this.src = src
		this.newName = newName
		this.renameFunc = renameFunc
		console.log('parsed', this.newName)
	}

	onOpen() {
		this.containerEl.addClass('image-rename-modal')
		const { contentEl } = this;

		const imageContainer = contentEl.createDiv({
			cls: 'image-container',
		})
		imageContainer.createEl('img', {
			attr: {
				src: this.app.vault.getResourcePath(this.src),
			}
		})

		const getNewPath = (name: string) => {
			return path.join(path.dirname(this.src.path), name)
		}
		let newPath = getNewPath(this.newName)
		const newNameParsed = path.parse(this.newName)

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
							text: newPath,
						}
					],
				}
			]
		})

		const doRename = async () => {
			debugLog('doRename', newPath)
			this.renameFunc(newPath)
		}

		const nameSetting = new Setting(contentEl)
			.setName('New name')
			.setDesc('templates: ')
			.addText(text => text
				.setValue(newNameParsed.name)
				.onChange(async (value) => {
					newPath = getNewPath(value + newNameParsed.ext)
					infoET.children[1].children[1].el.innerText = newPath
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
- {{DATE:$FORMAT}}: use "$FORMAT" to format the current date, "$FORMAT" must be a Moment.js format string, e.g. {{DATE:YYYY-MM-DD}}

Examples (imageNameKey = "foo"):
- {{imageNameKey}}-: foo-
- {{imageNameKey}}-{{DATE:YYYYMMDDHHmm}}: foo-202204081652
- Pasted Image {{DATE:YYYYMMDDHHmm}}: Pasted Image 202204081652
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
	}
}
