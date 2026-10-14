/* TODOs:
 * - [x] check name existence when saving
 * - [x] imageNameKey in frontmatter
 * - [x] after renaming, cursor should be placed after the image file link
 * - [x] handle image insert from drag'n drop
 * - [ ] select text when opening the renaming modal, make this an option
 * - [ ] add button for use the current file name, imageNameKey, last input name,
 *       segments of last input name
 * - [x] batch rename all pasted images in a file
 * - [ ] add rules for moving matched images to destination folder
 */
import {
  App,
  HeadingCache,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TAbstractFile,
  TFile,
} from 'obsidian';

import { ImageBatchRenameModal } from './batch';
import { planImageLinkConversion } from './link-conversion';
import { ImageLinkConversionModal } from './link-conversion-modal';
import { filenameTemplateStem, renderTemplate, TemplateDate } from './template';
import { assertFilenameOnly, headingBeforeReference, nameInputSelection, NameInputPosition, updateEmbedDestination, allocateName, splitRelativeFilename, compileExtensionPattern, IMAGE_EXTENSIONS, isExcludedPath, isTemporaryAttachment } from './rename-core';
import {
  createElementTree,
  getVaultConfig,
  DEBUG,
  debugLog,
  escapeRegExp,
  lockInputMethodComposition,
  NameObj,
  path,
  sanitizer,
} from './utils';

interface PluginSettings {
	// {{imageNameKey}}-{{DATE:YYYYMMDD}}
	imageNamePattern: string
	dupNumberAtStart: boolean
	dupNumberDelimiter: string
	dupNumberAcrossExtensions: boolean
	dupNumberAlways: boolean
	dupNumberWidth: number
	nameInputPosition: NameInputPosition
	autoRename: boolean
	handleAllAttachments: boolean
	excludeExtensionPattern: string
	excludedFolders: string
	disableRenameNotice: boolean
}

const DEFAULT_SETTINGS: PluginSettings = {
	imageNamePattern: '{{fileName}}',
	dupNumberAtStart: false,
	dupNumberDelimiter: '-',
	dupNumberAcrossExtensions: false,
	dupNumberAlways: false,
	dupNumberWidth: 1,
	nameInputPosition: 'end',
	autoRename: false,
	handleAllAttachments: false,
	excludeExtensionPattern: '',
	excludedFolders: '',
	disableRenameNotice: false,
}

const PASTED_IMAGE_PREFIX = 'Pasted image '


export default class PasteImageRenamePlugin extends Plugin {
	settings: PluginSettings
	modals: Modal[] = []
	excludeExtensionRegex: RegExp
	private renameQueue: Promise<void> = Promise.resolve()
	private pendingAttachments = new Map<TFile, {source: TFile, autoRename: boolean, timer: number}>()
	private unloaded = false

	async onload() {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const pkg = require('../package.json')
		console.log(`Plugin loading: ${pkg.name} ${pkg.version} BUILD_ENV=${process.env.BUILD_ENV}`)
		await this.loadSettings();

		// The official Vault API recommends registering here to exclude startup
		// scans. Creation timestamps are unreliable for copied/large/mobile files.
		this.app.workspace.onLayoutReady(() => {
			if (this.unloaded) return
			this.registerEvent(this.app.vault.on('create', file => this.trackAttachment(file)))
			this.registerEvent(this.app.vault.on('delete', file => {
				for (const [attachment, pending] of this.pendingAttachments) {
					if (attachment === file || pending.source === file) this.cancelPendingAttachment(attachment)
				}
			}))
			this.registerEvent(this.app.metadataCache.on('changed', source => this.processPendingAttachments(source)))
		})

		const startBatchRenameProcess = () => {
			this.openBatchRenameModal()
		}
		this.addCommand({
			id: 'batch-rename-embeded-files',
			name: 'Batch rename embeded files (in the current file)',
			callback: startBatchRenameProcess,
		})
		if (DEBUG) {
			this.addRibbonIcon('wand-glyph', 'Batch rename embeded files', startBatchRenameProcess)
		}

		const batchRenameAllImages = () => {
			void this.batchRenameAllImages().catch(error => new Notice(String(error)))
		}
		this.addCommand({
			id: 'batch-rename-all-images',
			name: 'Batch rename all images instantly (in the current file)',
			callback: batchRenameAllImages,
		})
		if (DEBUG) {
			this.addRibbonIcon('wand-glyph', 'Batch rename all images instantly (in the current file)', batchRenameAllImages)
		}

		this.addCommand({id: 'convert-markdown-image-links', name: 'Convert Markdown image links to wiki embeds (current note)', callback: () => this.openImageLinkConversion()})

		// add settings tab
		this.addSettingTab(new SettingTab(this.app, this));

	}

	private sourceReferencesAttachment(source: TFile, attachment: TFile): boolean {
		const cache = this.app.metadataCache.getFileCache(source)
		return [...(cache?.embeds || []), ...(cache?.links || [])].some(embed =>
			this.app.metadataCache.getFirstLinkpathDest(embed.link, source.path) === attachment)
	}

	trackAttachment(file: TAbstractFile) {
		if (this.unloaded || !(file instanceof TFile) || isMarkdownFile(file)) return
		if (!isPastedImage(file) && !this.settings.handleAllAttachments) return
		const source = this.getActiveFile()
		if (!source || this.isExcluded(file, source) || isTemporaryAttachment(file.path) || this.testExcludeExtension(file)) return
		// A restored/synced file resolving an existing embed is not a new insertion.
		if (this.sourceReferencesAttachment(source, file) || this.pendingAttachments.has(file)) return
		const timer = window.setTimeout(() => {
			this.cancelPendingAttachment(file)
			debugLog('Attachment left unchanged: no new source embed within 30 seconds', file.path)
		}, 30_000)
		this.pendingAttachments.set(file, {source, autoRename: this.settings.autoRename, timer})
	}

	private cancelPendingAttachment(file: TFile) {
		const pending = this.pendingAttachments.get(file)
		if (pending) window.clearTimeout(pending.timer)
		this.pendingAttachments.delete(file)
	}

	processPendingAttachments(source: TFile) {
		if (this.unloaded) return
		for (const [file, pending] of this.pendingAttachments) {
			if (pending.source !== source || !this.sourceReferencesAttachment(source, file)) continue
			this.cancelPendingAttachment(file)
			// Keep the source captured at creation, even after the user changes tabs.
			void this.startRenameProcess(file, pending.autoRename, source).catch(error => {
				console.error('Attachment rename failed', error)
				new Notice(`Attachment left unchanged or rename incomplete: ${error}`)
			})
		}
	}

	async startRenameProcess(file: TFile, autoRename = false, activeFile = this.getActiveFile()) {
		if (!activeFile || this.isExcluded(file, activeFile)) return

		const { stem, newName, isMeaningful }= this.generateNewName(file, activeFile)
		debugLog('generated newName:', newName, isMeaningful)

		if (!isMeaningful || !autoRename) {
			this.openRenameModal(file, isMeaningful ? stem : '', activeFile.path)
			return
		}
		await this.renameFile(file, newName, activeFile.path, true)
	}

	// Allocation and rename must be one serialized operation: concurrent paste events
	// otherwise choose the same free destination before either rename completes.
	renameFile(file: TFile, inputNewName: string, sourcePath: string, replaceCurrentLine = false): Promise<void> {
		const expectedPath = file.path
		const operation = (this.renameQueue || Promise.resolve()).then(() =>
			this.performRename(file, inputNewName, sourcePath, replaceCurrentLine, expectedPath))
		// A failed rename must not poison subsequent requests.
		this.renameQueue = operation.catch(() => {})
		return operation
	}

	private async performRename(file: TFile, inputNewName: string, sourcePath: string, replaceSourceLinks: boolean, expectedPath: string) {
		if (this.unloaded) return
		if (this.app.vault.getAbstractFileByPath(expectedPath) !== file) throw new Error('The attachment was replaced or deleted before this rename.')
		if (getVaultConfig(this.app)?.alwaysUpdateLinks === false) {
			throw new Error('Enable Obsidian’s Automatically update internal links setting before renaming attachments, so shared references remain valid.')
		}
		splitRelativeFilename(inputNewName)
		const { name: newName } = await this.deduplicateNewName(inputNewName, file)
		if (this.unloaded) return
		if (file.path !== expectedPath || this.app.vault.getAbstractFileByPath(expectedPath) !== file) throw new Error('The attachment moved while this rename was waiting. Try again from its current location.')
		const originName = file.name
		const newPath = path.join(file.parent.path, newName)
		if (newPath === file.path) return
		const sourceView = this.app.workspace.getActiveViewOfType(MarkdownView)
		const sourceFile = sourceView?.file?.path === sourcePath ? sourceView.file : null
		const embeds = replaceSourceLinks && sourceFile && sourceView.editor ? (this.app.metadataCache.getFileCache(sourceFile)?.embeds || [])
			.filter(embed => {
				if (this.app.metadataCache.getFirstLinkpathDest(embed.link, sourcePath) !== file || !embed.position) return false
				const {start, end} = embed.position
				const line = sourceView.editor.getLine(start.line)
				return start.line === end.line && typeof line === 'string' && line.slice(start.col, end.col) === embed.original
			})
			.map(embed => ({...embed, position: embed.position && {start: {...embed.position.start}, end: {...embed.position.end}}})) : []


		try {
			await this.app.fileManager.renameFile(file, newPath)
		} catch (err) {
			new Notice(`Failed to rename ${newName}: ${err}`)
			throw err
		}

		// Obsidian owns link updates. Only repair a still-present exact old link in
		// the original source note; never overwrite a cursor line in another note.
		const view = this.app.workspace.getActiveViewOfType(MarkdownView)
		if (replaceSourceLinks && view?.file === sourceFile && view.editor) {
			const editor = view.editor
			const newLinkText = this.app.fileManager.generateMarkdownLink(file, sourcePath)
			const changes = []
			for (const embed of embeds) {
				if (!embed.position) continue
				const {start, end} = embed.position
				if (start.line !== end.line) continue
				const line = editor.getLine(start.line)
				if (typeof line !== 'string') continue
				const current = line.slice(start.col, end.col)
				// Metadata positions may lag editor changes. Only replace an exact
				// live embed, and never touch arbitrary text or code examples.
				const replacement = updateEmbedDestination(embed.original, newLinkText)
				if (current === embed.original && replacement && replacement !== current) {
					changes.push({from: {line: start.line, ch: start.col}, to: {line: end.line, ch: end.col}, text: replacement})
				}
			}

			if (changes.length) editor.transaction({changes})
		}
		if (!this.settings.disableRenameNotice) new Notice(`Renamed ${originName} to ${newName}`)
	}

	openRenameModal(file: TFile, newName: string, sourcePath: string) {
		const modal = new ImageRenameModal(
			this.app, file as TFile, newName,
			(confirmedName: string) => {
				debugLog('confirmedName:', confirmedName)
				return this.renameFile(file, confirmedName, sourcePath, true)
			},
			() => {
				const index = this.modals.indexOf(modal)
				if (index >= 0) this.modals.splice(index, 1)
			},
			this.settings.nameInputPosition
		)
		this.modals.push(modal)
		modal.open()
		debugLog('modals count', this.modals.length)
	}

	openImageLinkConversion() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView)
		if (!view?.file || !view.editor) { new Notice('Open an editable Markdown note first.'); return }
		if (typeof view.editor.transaction !== 'function' || typeof view.editor.offsetToPos !== 'function') { new Notice('This conversion command requires the editor transaction API available in Obsidian 0.13.0 or newer.'); return }
		const source = view.file, sourcePath = source.path, editor = view.editor, original = editor.getValue()
		try {
			const plan = planImageLinkConversion(original, link => {
				const file = this.app.metadataCache.getFirstLinkpathDest(link, sourcePath)
				return file instanceof TFile && this.app.vault.getAbstractFileByPath(file.path) === file ? file : null
			})
			const modal = new ImageLinkConversionModal(this.app, plan, () => {
				if (this.unloaded || this.app.workspace.getActiveViewOfType(MarkdownView) !== view || view.file !== source || view.editor !== editor || source.path !== sourcePath || this.app.vault.getAbstractFileByPath(sourcePath) !== source || editor.getValue() !== original) {
					throw new Error('The note changed since preview. Cancel and run the command again.')
				}
				const changes = plan.filter(item => item.replacement !== undefined)
				for (const item of changes) if (!(item.target instanceof TFile) || item.target.path !== item.targetPath || this.app.vault.getAbstractFileByPath(item.targetPath) !== item.target) throw new Error('An image changed since preview. Cancel and run the command again.')
				editor.transaction({changes: changes.map(item => ({from: editor.offsetToPos(item.from), to: editor.offsetToPos(item.to), text: item.replacement}))})
			}, () => { const index = this.modals.indexOf(modal); if (index >= 0) this.modals.splice(index, 1) })
			this.modals.push(modal)
			modal.open()
		} catch (error) { new Notice(String(error)) }
	}

	openBatchRenameModal() {
		const activeFile = this.getActiveFile()
		if (!activeFile) {
			new Notice('No active Markdown file found.')
			return
		}
		const modal = new ImageBatchRenameModal(
			this.app,
			activeFile,
			async (file: TFile, name: string) => {
				await this.renameFile(file, name, activeFile.path)
			},
			() => {
				const index = this.modals.indexOf(modal)
				if (index >= 0) this.modals.splice(index, 1)
			}
		)
		this.modals.push(modal)
		modal.open()
	}

	async batchRenameAllImages() {
		const activeFile = this.getActiveFile()
		if (!activeFile) {
			new Notice('No active Markdown file found.')
			return
		}
		const fileCache = this.app.metadataCache.getFileCache(activeFile)
		if (!fileCache?.embeds) return
		// Resolve and de-duplicate before renaming changes cache paths.
		const files = new Set<TFile>()
		for (const embed of fileCache.embeds) {
			const file = this.app.metadataCache.getFirstLinkpathDest(embed.link, activeFile.path)
			if (file && isImage(file)) files.add(file)
		}
		const now = window.moment()
		for (const file of files) {
			const { newName, isMeaningful } = this.generateNewName(file, activeFile, now)
			if (!isMeaningful) {
				new Notice('Failed to batch rename images: the generated name is not meaningful')
				break
			}
			await this.renameFile(file, newName, activeFile.path, false)
		}
	}

	// returns a new name for the input file, with extension
	generateNewName(file: TFile, activeFile: TFile, now?: TemplateDate) {
		let imageNameKey = ''
		let firstHeading = ''
		let nearestHeading: string | undefined
		let frontmatter
		const fileCache = this.app.metadataCache.getFileCache(activeFile)
		if (fileCache) {
			debugLog('frontmatter', fileCache.frontmatter)
			frontmatter = fileCache.frontmatter
			imageNameKey = frontmatter?.imageNameKey ?? ''
			firstHeading = getFirstHeading(fileCache.headings)

		} else {
			console.warn('could not get file cache from active file', activeFile.name)
		}

		// Resolve through the renderer's actual named-variable access. This covers
		// bare, fallback and affix forms without a second, divergent token parser.
		const getNearestHeading = () => {
			if (nearestHeading !== undefined) return nearestHeading
			const referenceLines = [...(fileCache?.embeds || []), ...(fileCache?.links || [])]
				.filter(reference => this.app.metadataCache.getFirstLinkpathDest(reference.link, activeFile.path) === file)
				.map(reference => reference.position?.start.line)
				.filter(line => typeof line === 'number')
			nearestHeading = headingBeforeReference(fileCache?.headings || [], referenceLines.length ? Math.min(...referenceLines) : undefined)
			return nearestHeading
		}

		const rendered = renderTemplate(
			this.settings.imageNamePattern,
			{
				imageNameKey,
				fileName: activeFile.basename,
				dirName: activeFile.parent.name,
				firstHeading,
				attachmentName: file.basename,
				fileExt: file.extension,
				get nearestHeading() { return getNearestHeading() },
			},
			frontmatter, now)
		// An explicit terminal extension token opts into full-filename syntax.
		// Keep the modal stem-only and append the actual extension exactly once.
		// Never infer this from rendered data, which may itself contain ".png".
		const stem = filenameTemplateStem(this.settings.imageNamePattern, rendered, file.extension)
		assertFilenameOnly(stem)
		const safeStem = sanitizer.filename(stem)
		const meaninglessRegex = new RegExp(`[${escapeRegExp(this.settings.dupNumberDelimiter)}\\s]`, 'g')

		return {
			stem: safeStem,
			newName: safeStem + '.' + file.extension,
			isMeaningful: safeStem.replace(meaninglessRegex, '') !== '',
		}
	}

	// newName: foo.ext
	async deduplicateNewName(newName: string, file: TFile): Promise<NameObj> {
		const {directory, filename} = splitRelativeFilename(newName)
		const destinationDirectory = path.join(file.parent.path, directory)
		assertFilenameOnly(newName)
		const listed = await this.app.vault.adapter.list(destinationDirectory)
		const currentName = destinationDirectory === path.join(file.parent.path) ? file.name : undefined
		const name = allocateName(filename, [...listed.files, ...(listed.folders || [])].map(sibling => path.basename(sibling)), currentName, this.settings)
		const extension = path.extension(name)
		return {name: path.join(directory, name), stem: name.slice(0, -extension.length - 1), extension}
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
		this.unloaded = true
		for (const file of this.pendingAttachments.keys()) this.cancelPendingAttachment(file)
		const modals = [...this.modals]
		modals.forEach(modal => modal.close())
	}

	isExcluded(file: TFile, sourceFile?: TFile): boolean {
		const folders = this.settings.excludedFolders || ''
		return isExcludedPath(file.path, folders) || !!sourceFile && isExcludedPath(sourceFile.path, folders)
	}

	testExcludeExtension(file: TFile): boolean {
		try {
			return compileExtensionPattern(this.settings.excludeExtensionPattern)?.test(file.extension) ?? false
		} catch {
			// Fail closed: an invalid exclusion must not rename protected files.
			new Notice('Invalid exclude extension pattern. Automatic attachment renaming is paused until it is corrected.')
			return true
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

function getFirstHeading(headings?: HeadingCache[]) {
	if (headings && headings.length > 0) {
		for (const heading of headings) {
			if (heading.level === 1) {
				return heading.heading
			}
		}
	}
	return ''
}

function isPastedImage(file: TAbstractFile): boolean {
	if (file instanceof TFile) {
		if (file.name.startsWith(PASTED_IMAGE_PREFIX)) {
			return true
		}
	}
	return false
}

function isMarkdownFile(file: TAbstractFile): boolean {
	if (file instanceof TFile) {
		if (file.extension === 'md') {
			return true
		}
	}
	return false
}

function isImage(file: TAbstractFile): boolean {
	return file instanceof TFile && IMAGE_EXTENSIONS.has(file.extension.toLowerCase())
}

class ImageRenameModal extends Modal {
	src: TFile
	stem: string
	renameFunc: (path: string) => Promise<void>
	onCloseExtra: () => void

	constructor(app: App, src: TFile, stem: string, renameFunc: (path: string) => Promise<void>, onClose: () => void, private inputPosition: NameInputPosition = 'end') {
		super(app);
		this.src = src
		this.stem = stem
		this.renameFunc = renameFunc
		this.onCloseExtra = onClose
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
		let rawStem = this.stem
		const ext = this.src.extension
		const getNewName = (stem: string) => stem + '.' + ext
		const getNewPath = (stem: string) => path.join(this.src.parent.path, getNewName(stem))

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

		let renaming = false
		const doRename = async () => {
			if (renaming) return
			if (!stem.trim()) {
				errorEl.innerText = 'Error: "New name" could not be empty'
				errorEl.style.display = 'block'
				return
			}
			renaming = true
			try {
				assertFilenameOnly(rawStem)
				await this.renameFunc(getNewName(stem))
				this.close()
			} catch (error) {
				errorEl.innerText = String(error)
				errorEl.style.display = 'block'
			} finally {
				renaming = false
			}
		}

		const nameSetting = new Setting(contentEl)
			.setName('New name')
			.setDesc('Filename only, without extension. Directory names, relative paths (such as folder/name or ../name), and absolute paths are not supported. Choose attachment locations in Obsidian Settings → Files and links.')
			.addText(text => text
				.setValue(stem)
				.onChange(async (value) => {
					rawStem = value
					stem = sanitizer.filename(value)
					infoET.children[1].children[1].el.innerText = getNewPath(stem)
				}
				))

		const nameInputEl = nameSetting.controlEl.children[0] as HTMLInputElement
		const focusNameInput = () => {
			nameInputEl.focus()
			nameInputEl.setSelectionRange(...nameInputSelection(this.inputPosition, nameInputEl.value.length))
		}
		focusNameInput()
		new Setting(contentEl)
			.addButton(button => button
				.setButtonText('Use original name')
				.onClick(() => {
					rawStem = this.src.basename
					stem = sanitizer.filename(rawStem)
					nameInputEl.value = stem
					infoET.children[1].children[1].el.innerText = getNewPath(stem)
					focusNameInput()
				}))
		const nameInputState = lockInputMethodComposition(nameInputEl)
		nameInputEl.addEventListener('keydown', async (e) => {
			// console.log('keydown', e.key, `lock=${nameInputState.lock}`)
			if (e.key === 'Enter' && !nameInputState.lock) {
				e.preventDefault()
				if (!stem) {
					errorEl.innerText = 'Error: "New name" could not be empty'
					errorEl.style.display = 'block'
					return
				}
				void doRename()
			}
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
					.setButtonText('Rename')
					.onClick(() => {
						void doRename()
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
}

const imageNamePatternDesc = `
The pattern indicates how the new name should be generated.

Available variables:
- {{fileName}}: name of the active file, without ".md" extension.
- {{fileNameSlug}} (or {{FileNameSlug}}): lowercase note name with whitespace replaced by hyphens; Unicode is preserved.
- {{attachmentName}} (or {{originalAttachmentFileName}}): attachment stem before this operation, without its extension.
- {{nearestHeading}} (or {{headerName}}): nearest heading before the first reference to this attachment in the source note; empty if none.
- {{UUID}}: a new UUID per attachment operation; {{HEX}} is the same UUID without hyphens.
- {{dirName}}: name of the directory which contains the document (the root directory of vault results in an empty variable).
- {{imageNameKey}}: this variable is read from the markdown file's frontmatter, from the same key "imageNameKey".
- {{DATE:$FORMAT}}: use "$FORMAT" to format the current date, "$FORMAT" must be a Moment.js format string, e.g. {{DATE:YYYY-MM-DD}}.

Here are some examples from pattern to image names (repeat in sequence), variables: fileName = "My note", imageNameKey = "foo":
- {{fileName}}: My note, My note-1, My note-2
- {{imageNameKey}}: foo, foo-1, foo-2
- {{imageNameKey}}-{{DATE:YYYYMMDD}}: foo-20220408, foo-20220408-1, foo-20220408-2
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
			.setDesc(`The delimiter to generate the number prefix/suffix for duplicated names. For example, if the value is "-", the suffix will be like "-1", "-2", "-3", and the prefix will be like "1-", "2-", "3-". Only characters that are valid in file names are allowed.`)
			.addText(text => text
				.setValue(this.plugin.settings.dupNumberDelimiter)
				.onChange(async (value) => {
					this.plugin.settings.dupNumberDelimiter = sanitizer.delimiter(value);
					await this.plugin.saveSettings();
				}
			));

		new Setting(containerEl)
			.setName('Always add duplicate number')
			.setDesc(`If enabled, duplicate number will always be added to the image name. Otherwise, it will only be added when the name is duplicated.`)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.dupNumberAlways)
				.onChange(async (value) => {
					this.plugin.settings.dupNumberAlways = value
					await this.plugin.saveSettings()
				}
				))

		new Setting(containerEl)
			.setName('Share duplicate numbers across extensions')
			.setDesc('Use one filename-stem namespace in the attachment folder, so PNG/JPG/etc. receive distinct numbers. Off by default. Existing conflicts are resolved only when those files are renamed.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.dupNumberAcrossExtensions)
				.onChange(async value => {
					this.plugin.settings.dupNumberAcrossExtensions = value
					await this.plugin.saveSettings()
				}))

		new Setting(containerEl)
			.setName('Duplicate number minimum digits')
			.setDesc('Minimum digits for new duplicate numbers (1–12). Existing numbered filenames stay unchanged.')
			.addText(text => text
				.setValue(String(this.plugin.settings.dupNumberWidth))
				.onChange(async value => {
					const width = Number(value)
					if (!Number.isInteger(width) || width < 1 || width > 12) return
					this.plugin.settings.dupNumberWidth = width
					await this.plugin.saveSettings()
				}))

		new Setting(containerEl)
			.setName('Rename input selection')
			.setDesc('Initial cursor or selection in the rename prompt. Also applies after Use original name.')
			.addDropdown(dropdown => dropdown
				.addOption('end', 'Cursor at end')
				.addOption('start', 'Cursor at start')
				.addOption('select', 'Select all')
				.setValue(this.plugin.settings.nameInputPosition)
				.onChange(async value => {
					this.plugin.settings.nameInputPosition = value as NameInputPosition
					await this.plugin.saveSettings()
				}))

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
			.setName('Handle all attachments')
			.setDesc(`By default, the plugin only handles images that starts with "Pasted image " in name,
			which is the prefix Obsidian uses to create images from pasted content.
			If this option is set, the plugin will handle all attachments that are created in the vault.`)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.handleAllAttachments)
				.onChange(async (value) => {
					this.plugin.settings.handleAllAttachments = value;
					await this.plugin.saveSettings();
				}
			));

		new Setting(containerEl)
			.setName('Exclude extension pattern')
			.setDesc(`This option is only useful when "Handle all attachments" is enabled.
			Write a Regex pattern to exclude certain extensions from being handled. Only the first line will be used.`)
			.setClass('single-line-textarea')
			.addTextArea(text => text
				.setPlaceholder('docx?|xlsx?|pptx?|zip|rar')
				.setValue(this.plugin.settings.excludeExtensionPattern)
				.onChange(async (value) => {
					this.plugin.settings.excludeExtensionPattern = value;
					await this.plugin.saveSettings();
				}
			));

		new Setting(containerEl)
			.setName('Excluded folders')
			.setDesc('Skip automatic renaming when the attachment or its source note is in one of these vault-relative folders. One folder per line; subfolders are included. Manual batch commands are unaffected.')
			.addTextArea(text => text
				.setPlaceholder('Telegram\nZotero')
				.setValue(this.plugin.settings.excludedFolders)
				.onChange(async value => {
					this.plugin.settings.excludedFolders = value
					await this.plugin.saveSettings()
				}))

		new Setting(containerEl)
			.setName('Disable rename notice')
			.setDesc(`Turn off this option if you don't want to see the notice when renaming images.
			Note that Obsidian may display a notice when a link has changed, this option cannot disable that.`)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.disableRenameNotice)
				.onChange(async (value) => {
					this.plugin.settings.disableRenameNotice = value;
					await this.plugin.saveSettings();
				}
			));
	}
}
