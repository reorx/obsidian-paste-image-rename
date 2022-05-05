import { Modal, TFile, App, Setting } from 'obsidian';

import { createElementTree, lockInputMethodComposition } from './utils';

interface State {
	namePattern: string
	nameReplace: string
	matchedFiles: TFile[]
}

export class ImageBatchRenameModal extends Modal {
	activeFile: TFile
	renameFunc: (file: TFile, name: string) => void
	onCloseExtra: () => void
	state: State

	constructor(app: App, activeFile: TFile, renameFunc: (file: TFile, name: string) => void, onClose: () => void) {
		super(app);
		this.activeFile = activeFile
		this.renameFunc = renameFunc
		this.onCloseExtra = onClose

		this.state = {
			namePattern: '',
			nameReplace: '',
			matchedFiles: [],
		}
		// getFirstLinkpathDest
	}

	onOpen() {
		this.containerEl.addClass('image-rename-modal')
		const { contentEl, titleEl } = this;
		titleEl.setText('Batch rename images')


		const namePatternSetting = new Setting(contentEl)
			.setName('Name pattern')
			.setDesc('Please input the name pattern to match images (regex)')
			.addText(text => text
				.setValue(this.state.namePattern)
				.onChange(async (value) => {
					this.state.namePattern = value
				}
				))

		const npInputEl = namePatternSetting.controlEl.children[0] as HTMLInputElement
		npInputEl.focus()
		const npInputState = lockInputMethodComposition(npInputEl)
		npInputEl.addEventListener('keydown', async (e) => {
			// console.log('keydown', e.key, `lock=${nameInputState.lock}`)
			if (e.key === 'Enter' && !npInputState.lock) {
				e.preventDefault()
				if (!this.state.namePattern) {
					errorEl.innerText = 'Error: "Name pattern" could not be empty'
					errorEl.style.display = 'block'
					return
				}
				this.matchImageNames(tableET.children[1].el)
			}
		})

		const nameReplaceSetting = new Setting(contentEl)
			.setName('Name replace')
			.setDesc('Please input the string to replace the matched part (use $1, $2 for regex groups)')
			.addText(text => text
				.setValue(this.state.nameReplace)
				.onChange(async (value) => {
					this.state.nameReplace = value
				}
				))

		const nrInputEl = nameReplaceSetting.controlEl.children[0] as HTMLInputElement
		nrInputEl.focus()
		const nrInputState = lockInputMethodComposition(nrInputEl)
		nrInputEl.addEventListener('keydown', async (e) => {
			// console.log('keydown', e.key, `lock=${nameInputState.lock}`)
			if (e.key === 'Enter' && !nrInputState.lock) {
				e.preventDefault()
				this.matchImageNames(tableET.children[1].el)
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
									text: 'Original Name',
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

		const errorEl = contentEl.createDiv({
			cls: 'error',
			attr: {
				style: 'display: none;',
			}
		})

		new Setting(contentEl)
			.addButton(button => {
				button
					.setButtonText('Rename all')
					.setClass('mod-cta')
					.onClick(() => {
						new ConfirmModal(
							this.app,
							'Confirm rename all',
							`Are you sure? This will rename all the ${this.state.matchedFiles.length} images matched the pattern.`,
							() => {
								this.renameAll()
								this.close()
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
		const { contentEl } = this;
		contentEl.empty();
		this.onCloseExtra()
	}

	renameAll() {
		console.log('rename all', this.state)
	}

	matchImageNames(tbodyEl: HTMLElement) {
		const { state } = this
		const matchedFiles: TFile[] = []
		tbodyEl.empty()
		const fileCache = this.app.metadataCache.getFileCache(this.activeFile)
		if (!fileCache || !fileCache.embeds) return
		const namePatternRegex = new RegExp(state.namePattern, 'gm')
		fileCache.embeds.forEach(embed => {
			const file = this.app.metadataCache.getFirstLinkpathDest(embed.link, this.activeFile.path)
			if (!file) {
				console.warn('file not found', embed.link)
				return
			}
			const stem = file.basename
			const m = namePatternRegex.exec(stem)
			if (!m) return

			matchedFiles.push(file)
			let renamedName = file.name
			if (state.nameReplace) {
				renamedName = stem.replace(namePatternRegex, state.nameReplace)
				renamedName = `${renamedName}.${file.extension}`
			}

			createElementTree(tbodyEl, {
				tag: 'tr',
				children: [
					{
						tag: 'td',
						text: file.name,
					},
					{
						tag: 'td',
						text: renamedName,
					}
				]

			})
			// console.log('matched file', file)
		})
		state.matchedFiles = matchedFiles
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
