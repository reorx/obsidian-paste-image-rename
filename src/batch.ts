import { Modal, TFile, App, Setting, Notice } from 'obsidian';
import { splitRelativeFilename } from './rename-core';

import {
  path, createElementTree, debugLog, lockInputMethodComposition,
} from './utils';

interface State {
	namePattern: string
	extPattern: string
	nameReplace: string
	renameTasks: RenameTask[]
}

interface RenameTask {
	file: TFile
	name: string
	originalPath: string
}

type renameFuncType = (file: TFile, name: string) => Promise<void>

export class ImageBatchRenameModal extends Modal {
	activeFile: TFile
	renameFunc: renameFuncType
	onCloseExtra: () => void
	state: State

	constructor(app: App, activeFile: TFile, renameFunc: renameFuncType, onClose: () => void) {
		super(app);
		this.activeFile = activeFile
		this.renameFunc = renameFunc
		this.onCloseExtra = onClose

		this.state = {
			namePattern: '',
			extPattern: '',
			nameReplace: '',
			renameTasks: [],
		}
	}

	onOpen() {
		this.containerEl.addClass('image-rename-modal')
		const { contentEl, titleEl } = this;
		titleEl.setText('Batch rename embeded files')

		let npInputEl: HTMLInputElement
		new Setting(contentEl)
			.then(setting => setting.nameEl.setText('Name pattern'))
			.setDesc('Please input the name pattern to match files (regex)')
			.addText(text => {
				npInputEl = text.inputEl
				text.setValue(this.state.namePattern)
				.onChange((value) => {
					this.state.namePattern = value
					this.state.renameTasks = []
				}
				)
			})
		npInputEl.focus()
		const npInputState = lockInputMethodComposition(npInputEl)
		npInputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !npInputState.lock) {
				e.preventDefault()
				if (!this.state.namePattern) {
					errorEl.innerText = 'Error: "Name pattern" could not be empty'
					errorEl.classList.add('is-visible')
					return
				}
				this.matchImageNames(tbodyEl)
			}
		})

		let extInputEl: HTMLInputElement
		new Setting(contentEl)
			.then(setting => setting.nameEl.setText('Extension pattern'))
			.setDesc('Please input the extension pattern to match files (regex)')
			.addText(text => {
				extInputEl = text.inputEl
				text.setValue(this.state.extPattern)
				.onChange((value) => {
					this.state.extPattern = value
					this.state.renameTasks = []
				}
				)
			})
		extInputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault()
				this.matchImageNames(tbodyEl)
			}
		})

		let nrInputEl: HTMLInputElement
		new Setting(contentEl)
			.then(setting => setting.nameEl.setText('Name replace'))
			.setDesc('Please input the string to replace the matched name (use $1, $2 for regex groups)')
			.addText(text => {
				nrInputEl = text.inputEl
				text.setValue(this.state.nameReplace)
				.onChange((value) => {
					this.state.nameReplace = value
					this.state.renameTasks = []
				}
				)
			})
		const nrInputState = lockInputMethodComposition(nrInputEl)
		nrInputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !nrInputState.lock) {
				e.preventDefault()
				this.matchImageNames(tbodyEl)
			}
		})


		const matchedContainer = contentEl.createDiv({
			cls: 'matched-container',
		})
		const tableET = createElementTree(matchedContainer, {
			tag: 'table',
			children: [
				{
					tag: 'thead',
					children: [
						{
							tag: 'tr',
							children: [
								{
									tag: 'td',
									text: 'Original path',
								},
								{
									tag: 'td',
									text: 'Renamed Name',
								}
							]
						}
					]
				},
				{
					tag: 'tbody',
				}
			]
		})
		const tbodyEl = tableET.children[1].el

		const errorEl = contentEl.createDiv({
			cls: 'error',
		})

		new Setting(contentEl)
			.addButton(button => button.setButtonText('Preview').onClick(() => this.matchImageNames(tbodyEl)))
			.addButton(button => {
				button
					.setButtonText('Rename all')
					.setClass('mod-cta')
					.onClick(() => {
						if (!this.state.renameTasks.length) { new Notice('Preview matching files before renaming.'); return }
						const tasks = [...this.state.renameTasks]
						new ConfirmModal(
							this.app,
							'Confirm rename all',
							`Are you sure? This will rename all the ${this.state.renameTasks.length} images matched the pattern.`,
							() => {
								void this.renameAll(tasks).then(() => this.close()).catch(error => new Notice(String(error)))
							}
						).open()
					})
			})
			.addButton(button => {
				button
					.setButtonText('Cancel')
					.onClick(() => { this.close() })
			})
	}

	onClose() {
		this.closed = true
		const { contentEl } = this;
		contentEl.empty();
		this.onCloseExtra()
	}

	private renaming = false
	private closed = false

	async renameAll(tasks = [...this.state.renameTasks]) {
		if (this.renaming || this.closed) return
		this.renaming = true
		try {
			// Validate the entire preview before the first mutation, rather than
			// discovering a known invalid or stale target halfway through a batch.
			for (const task of tasks) {
				if (task.file.path !== task.originalPath || this.app.vault.getAbstractFileByPath(task.originalPath) !== task.file) throw new Error('A previewed file moved or was replaced/deleted. Preview matching files again.')
				if (splitRelativeFilename(task.name).directory) throw new Error('Folder paths are not supported; preview filenames only.')
			}
			let completed = 0
			for (const task of tasks) {
				if (this.closed) {
					new Notice(`Batch canceled after ${completed} of ${tasks.length} files. Completed renames were kept.`)
					return
				}
				try {
					if (task.file.path !== task.originalPath || this.app.vault.getAbstractFileByPath(task.originalPath) !== task.file) throw new Error('A previewed file moved or was replaced/deleted. Preview matching files again.')
					await this.renameFunc(task.file, task.name)
					completed++
				} catch (error) {
					throw new Error(`Renamed ${completed} of ${tasks.length} files; stopped at ${task.originalPath}: ${error}`)
				}
			}
		} finally {
			this.renaming = false
			this.state.renameTasks = []
		}
	}

	matchImageNames(tbodyEl: HTMLElement) {
		const { state } = this
		state.renameTasks = []
		const renameTasks: RenameTask[] = []
		tbodyEl.empty()
		const fileCache = this.app.metadataCache.getFileCache(this.activeFile)
		if (!fileCache || !fileCache.embeds) return

		let namePatternRegex: RegExp, extPatternRegex: RegExp
		try {
			namePatternRegex = new RegExp(state.namePattern, 'g')
			extPatternRegex = new RegExp(state.extPattern)
		} catch (error) { new Notice(`Invalid preview pattern: ${error}`); return }
		const seen = new Set<TFile>()
		fileCache.embeds.forEach(embed => {
			const file = this.app.metadataCache.getFirstLinkpathDest(embed.link, this.activeFile.path)
			if (!file) {
				console.warn('file not found', embed.link)
				return
			}
			if (seen.has(file)) return
			seen.add(file)
			// match ext (only if extPattern is not empty)
			if (state.extPattern) {
				const m0 = extPatternRegex.exec(file.extension)
				if (!m0) return
			}

			// match stem
			const stem = file.basename
			namePatternRegex.lastIndex = 0
			const m1 = namePatternRegex.exec(stem)
			if (!m1) return

			let renamedName = file.name
			if (state.nameReplace) {
				namePatternRegex.lastIndex = 0
				renamedName = stem.replace(namePatternRegex, state.nameReplace)
				renamedName = `${renamedName}.${file.extension}`
			}
			renameTasks.push({
				file,
				name: renamedName,
				originalPath: file.path,
			})

			createElementTree(tbodyEl, {
				tag: 'tr',
				children: [
					{
						tag: 'td',
						children: [
							{
								tag: 'span',
								text: file.name,
							},
							{
								tag: 'div',
								text: file.path,
								attr: {
									class: 'file-path',
								}
							}
						]
					},
					{
						tag: 'td',
						children: [
							{
								tag: 'span',
								text: renamedName,
							},
							{
								tag: 'div',
								text: path.join(file.parent.path, renamedName),
								attr: {
									class: 'file-path',
								}
							}
						]
					}
				]

			})
		})

		debugLog('new renameTasks', renameTasks)
		state.renameTasks = renameTasks
	}
}


class ConfirmModal extends Modal {
	title: string
	message: string
	onConfirm: () => void

	constructor(app: App, title: string, message: string, onConfirm: () => void) {
		super(app);
		this.title = title
		this.message = message
		this.onConfirm = onConfirm
	}

	onOpen(): void {
		const { contentEl, titleEl } = this;
		titleEl.setText(this.title)
		contentEl.createEl('p', {
			text: this.message,
		})

		new Setting(contentEl)
			.addButton(button => {
				button
					.setButtonText('Yes')
					.setClass('mod-warning')
					.onClick(() => {
						this.onConfirm()
						this.close()
					})
			})
			.addButton(button => {
				button
					.setButtonText('No')
					.onClick(() => { this.close() })
			})
	}
}
