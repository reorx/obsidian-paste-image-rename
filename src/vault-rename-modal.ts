import { App, Modal, Notice, Setting } from 'obsidian';
import { VaultImageRenamePlan, VaultRenameResult } from './vault-rename';

export class VaultImageRenameModal extends Modal {
	private closed = false
	private started = false
	constructor(app: App, private plan: VaultImageRenamePlan, private apply: () => Promise<VaultRenameResult>, private unregister: () => void) { super(app) }
	onOpen() {
		this.titleEl.setText('Preview image renames (whole vault)')
		const ready = this.plan.rows.filter(row => row.targetPath && !row.reason)
		this.contentEl.createEl('p', {text: `${ready.length} images ready; ${this.plan.rows.length-ready.length} unchanged or skipped. Dates, random values and exact destination paths are frozen. Only agreeing Markdown sources participate. Files stay in their current folders.`})
		this.contentEl.createEl('p', {text: 'Safety scan limits: 2,000 files/folders, 20 MB per file, 200 MB total, and 2 million characters per note/container. The complete vault is checked again for each rename.'})
		this.contentEl.createEl('p', {text: 'Apply renames images through Obsidian, which updates internal links. Close or Cancel stops remaining operations; an in-flight rename may finish. Failures stop the batch without rollback. Review the partial report and make a new preview before retrying.'})
		for (const row of this.plan.rows) {
			const item = this.contentEl.createDiv()
			item.createEl('p', {text: row.originalPath + (row.targetPath ? ' → ' + row.targetPath : '')})
			if (row.reason) item.createEl('p', {text: 'Skipped/unchanged: ' + row.reason})
			for (const proposal of row.proposals) item.createEl('p', {text: `${proposal.sourcePath}: ${proposal.name || '(no safe filename)'}${proposal.reason ? ' — '+proposal.reason : ''}`})
		}
		const status = this.contentEl.createEl('p')
		const actions = new Setting(this.contentEl)
		if (ready.length) actions.addButton(button => button.setButtonText('Apply image renames').onClick(async () => {
			if (this.closed || this.started) return
			this.started = true; button.setDisabled(true)
			status.setText('Verifying the preview and applying exact paths…')
			const result = await this.apply()
			const summary = `${result.renamed.length} image(s) renamed.${result.stopped ? ' Stopped: '+result.stopped : ' Finished.'}${result.attempted ? ' Outcome of '+result.attempted+' → '+result.attemptedTarget+' is uncertain; inspect it before retrying.' : ''} No rollback was attempted.`
			if (!this.closed) {
				status.setText(summary)
				for (const path of result.renamed) status.createEl('p', {text:'Renamed: '+path})
			}
			const details = this.closed && result.renamed.length ? '\nCompleted paths:\n'+result.renamed.join('\n') : ''
			new Notice(summary+details, result.stopped ? 0 : 15000)
		}))
		actions.addButton(button => button.setButtonText('Cancel / Close').onClick(() => this.close()))
	}
	onClose() { this.closed = true; this.plan.close(); this.contentEl.empty(); this.unregister() }
}
