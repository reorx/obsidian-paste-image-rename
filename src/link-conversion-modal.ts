import { App, Modal, Setting } from 'obsidian';
import { ImageConversion } from './link-conversion';

export class ImageLinkConversionModal extends Modal {
	private finished = false
	constructor(app: App, private plan: ImageConversion[], private apply: () => void, private unregister: () => void) { super(app) }
	onOpen() {
		this.titleEl.setText('Convert Markdown image links to wiki embeds')
		const safe = this.plan.filter(item => item.replacement !== undefined)
		this.contentEl.createEl('p', {text: `${safe.length} supported conversions; ${this.plan.length - safe.length} skipped. Only this note changes, in one undoable editor transaction. Images are not renamed or moved.`})
		for (const item of this.plan) {
			const row = this.contentEl.createDiv()
			row.createEl('code', {text: item.original})
			row.createEl('p', {text: item.replacement !== undefined ? '→ ' + item.replacement : 'Skipped: ' + item.reason})
		}
		const error = this.contentEl.createEl('p')
		const actions = new Setting(this.contentEl)
		if (safe.length) actions.addButton(button => button.setButtonText('Convert supported images').onClick(() => {
			if (this.finished) return
			try { this.apply(); this.finished = true; this.close() }
			catch (failure) { error.setText(String(failure)) }
		}))
		actions.addButton(button => button.setButtonText('Cancel').onClick(() => this.close()))
	}
	onClose() { this.finished = true; this.contentEl.empty(); this.unregister() }
}
