/* TODOs:
 * - [ ] check name existence when saving
 * - [ ] imageNameKey in frontmatter
 * - [ ] add context menu for renaming the link/file
 * - [ ] batch rename all pasted images in a file
 */
import {
  App, Plugin, PluginSettingTab, Setting, TFile, TAbstractFile,
  Modal,
} from 'obsidian';

import { DEBUG } from './utils';

interface PluginSettings {
	// {{imageNameKey}}-{{DATE:YYYY-MM-DD}}
	imageNamePattern: string
	dupNumberAtStart: boolean
	dupNumberDelimiter: string
	alwaysConfirmRename: boolean
}

// TODO two functions: rename, autoRename

const DEFAULT_SETTINGS: PluginSettings = {
	imageNamePattern: '{{imageNameKey}}-',
	dupNumberAtStart: false,
	dupNumberDelimiter: '-',
	alwaysConfirmRename: true,
}

const PASTED_IMAGE_PREFIX = 'Pasted image '


export default class PasteImageRenamePlugin extends Plugin {
	settings: PluginSettings
	debugModal: ImageRenameModal|null

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
				console.log('file created', file)
				new ImageRenameModal(this.app, file as TFile).open();
			})
		)

		// add settings tab
		this.addSettingTab(new SettingTab(this.app, this));

		// debug code
		if (DEBUG) {
			var imageFile: TFile
			for (const file of this.app.vault.getFiles()) {
				if (isPastedImage(file)) {
					imageFile = file
					break
				}
			}
			if (imageFile) {
				this.debugModal = new ImageRenameModal(this.app, imageFile as TFile)
				this.debugModal.open()
			}
		}
	}

	onunload() {
		this.debugModal?.close()
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

	constructor(app: App, src: TFile) {
		super(app);
		this.src = src
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

		contentEl.createEl('div', {
			cls: 'origin-path',
			text: `Image path: ${this.src.path}`,
		})

		new Setting(contentEl)
			.setName('New name')
			.setDesc('templates: ')
			.addText(text => text
				.setValue('')
				.onChange(async (value) => {
					console.log(value)
				}
				))

		new Setting(contentEl)
			.addButton(button => {
				button
					.setButtonText('Rename')
					.onClick(() => {
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
			.setName('Always confirm rename')
			.setDesc(`If set, the rename modal will always be shown to confirm before renaming, otherwise the image will be auto renamed after pasting.`)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.alwaysConfirmRename)
				.onChange(async (value) => {
					this.plugin.settings.alwaysConfirmRename = value;
					await this.plugin.saveSettings();
				}
			));
	}
}
