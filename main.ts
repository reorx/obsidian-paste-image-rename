/* TODOs:
 * - check name existence when saving
 * - add context menu for renaming the link/file
 */
import {
	App, Plugin, PluginSettingTab, Setting,
	TFile, TAbstractFile,
	Modal,
} from 'obsidian';
import $ from 'cash-dom';


interface PluginSettings {
	// ${imageNameKey}-${input}${numberSuffix('-')}
	// if no ${number} in newNamePattern, the number will be automatically added.
	newNamePattern: string
	// if no ${input} in newNamePattern, the file will be automatically renamed.
	autoRenameIfNoInputRequired: boolean
}

const DEFAULT_SETTINGS: PluginSettings = {
	newNamePattern: '${imageNameKey}${numberSuffix("-")}',
	autoRenameIfNoInputRequired: false,
}

const DEBUG = true

const PASTED_IMAGE_PREFIX = 'Pasted image '


export default class PasteImageRenamePlugin extends Plugin {
	settings: PluginSettings
	debugModal: ImageRenameModal|null

	async onload() {
		await this.loadSettings();
		console.log('paste image rename plugin loaded')

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

const modalContent = `
<div class="image"><img></div>
<div class="inputs">
	<input type="text" placeholder="title" class="title">
	<input type="button" value="save" class="save">
</div>
`

class ImageRenameModal extends Modal {
	src: TFile

	constructor(app: App, src: TFile) {
		super(app);
		this.src = src
	}

	onOpen() {
		this.containerEl.addClass('image-rename-modal')
		const { contentEl } = this;

		const content = $(modalContent)
		content.find('.image img').attr('src', this.app.vault.getResourcePath(this.src))
		$(contentEl).append(content)
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

const newNamePatternDesc = `
A pattern indicating how the new name should be generated.

Available variables:
- \${imageNameKey}: this variable is read from the markdown file's frontmatter, if not present, an empty string will be used.
- \${numberSuffix(DELIMITER)}: pass DELIMITER to this function to generate the number suffix for duplicated names. e.g. \${numberSuffix("-")} will generate "-1", "-2", "-3", etc.
- \${numberPrefix(DELIMITER)}: pass DELIMITER to this function to generate the number prefix for duplicated names. e.g. \${numberPrefix("_")} will generate "1_", "2_", "3_", etc.
- \${input}: custom input, cursor will be put here for you to type in.
if no \${number} in newNamePattern, the number will be automatically added.
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
			.setName('New name pattern')
			.setDesc(newNamePatternDesc)
			.addText(text => text
				.setPlaceholder('${imageNameKey}-${input}')
				.setValue(this.plugin.settings.newNamePattern)
				.onChange(async (value) => {
					this.plugin.settings.newNamePattern = value;
					await this.plugin.saveSettings();
				}
			));

		new Setting(containerEl)
			.setName('Auto rename if no input required')
			.setDesc(`if no \${input} in newNamePattern, the file will be automatically renamed.`)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoRenameIfNoInputRequired)
				.onChange(async (value) => {
					this.plugin.settings.autoRenameIfNoInputRequired = value;
					await this.plugin.saveSettings();
				}
			));
	}
}
