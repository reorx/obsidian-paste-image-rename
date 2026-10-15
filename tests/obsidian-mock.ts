export class MockElement {
    children: MockElement[] = [];
    innerText = '';
    value = '';
    style: Record<string, string> = {};
    classes = new Set<string>();
    classList = { add: (...names: string[]) => names.forEach(name => this.classes.add(name)), contains: (name: string) => this.classes.has(name) };
    events: Record<string, Function[]> = {};
    tag = '';
    selectionStart = 0;
    selectionEnd = 0;
    constructor(tag = '', text = '') { this.tag = tag; this.innerText = text; }
    createEl(tag: string, opts: any = {}) { const el = new MockElement(tag, opts.text || ''); this.children.push(el); return el; }
    createDiv(opts: any = {}) { return this.createEl('div', opts); }
    addClass() { }
    setText(text: string) { this.innerText = text; }
    empty() { this.children = []; }
    focus() { }
    setSelectionRange(start: number, end: number) { this.selectionStart = start; this.selectionEnd = end; }
    addEventListener(name: string, fn: Function) { (this.events[name] ??= []).push(fn); }
    async emit(name: string, event: any = {}) { for (const fn of this.events[name] || [])
        await fn(event); }
    find(tag: string, text?: string): MockElement | undefined { if (this.tag === tag && (text === undefined || this.innerText === text))
        return this; for (const child of this.children) {
        const found = child.find(tag, text);
        if (found)
            return found;
    } }
}
export class Plugin {
}
export class Modal {
    app: any;
    contentEl = new MockElement('content');
    containerEl = new MockElement('container');
    titleEl = new MockElement('title');
    constructor(app: any) { this.app = app; }
    open() { (this as any).onOpen?.(); }
    close() { (this as any).onClose?.(); }
}
export class PluginSettingTab {
}
export class MarkdownView {
}
export class Setting {
    static created: Setting[] = [];
    nameEl = new MockElement('name');
    then(callback: (setting: this) => unknown) { callback(this); return this; }
    controlEl = new MockElement('control');
    constructor(parent: MockElement) { parent.children.push(this.controlEl); Setting.created.push(this); }
    setName() { return this; }
    setDesc() { return this; }
    setClass() { return this; }
    addText(fn: Function) { const inputEl = new MockElement('input'); this.controlEl.children.push(new MockElement('span', 'host decoration'), inputEl); const component = { inputEl, setValue(v: string) { inputEl.value = v; return this; }, setPlaceholder() { return this; }, onChange(cb: Function) { inputEl.addEventListener('change', () => cb(inputEl.value)); return this; } }; fn(component); return this; }
    addTextArea(fn: Function) { return this.addText(fn); }
    addToggle(fn: Function) { const toggleEl = new MockElement('toggle'); this.controlEl.children.push(toggleEl); const component = { setValue(value: boolean) { (toggleEl as any).checked = value; return this; }, onChange(cb: Function) { toggleEl.addEventListener('change', () => cb((toggleEl as any).checked)); return this; } }; fn(component); return this; }
    addDropdown(fn: Function) { const selectEl = new MockElement('select'); this.controlEl.children.push(selectEl); const component = { addOption(value: string, label: string) { const option = selectEl.createEl('option', {text: label}); option.value = value; return this; }, setValue(value: string) { selectEl.value = value; return this; }, onChange(cb: Function) { selectEl.addEventListener('change', () => cb(selectEl.value)); return this; } }; fn(component); return this; }
    addButton(fn: Function) { const buttonEl = new MockElement('button'); this.controlEl.children.push(buttonEl); const component = { buttonEl, setButtonText(v: string) { buttonEl.innerText = v; return this; }, setClass() { return this; }, setDisabled(value: boolean) { (buttonEl as any).disabled = value; return this; }, onClick(cb: Function) { buttonEl.addEventListener('click', cb); return this; } }; fn(component); return this; }
}
export class TAbstractFile {
}
export class TFile extends TAbstractFile {
}
export class Notice {
    constructor(public message: string) { }
}
// Test-only YAML implementation; production uses Obsidian's public parseYaml.
export const parseYaml = (text: string) => require('js-yaml').load(text);

export const sdkApi = { supported: false };
export let requireApiVersion: (() => boolean) | undefined = () => sdkApi.supported;
export const setApiAvailability = (available: boolean) => { requireApiVersion = available ? () => sdkApi.supported : undefined; };

// Independent SDK clock: tests must not accidentally pass via window.moment.
export const sdkClock = { now: () => ({ format: (pattern: string) => pattern === 'YYYY' ? '2026' : '10' }) };
export const moment = () => sdkClock.now();
