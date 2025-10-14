import LiveStorage from '../../utils/live-storage.ts';
import { OPTIONS } from './settings.ts';

const storage = LiveStorage;
const manifest = browser.runtime.getManifest();
document.querySelectorAll('.extension-name').forEach((elem: Element) => {
    (elem as HTMLElement).textContent = manifest.name;
});
const versionElement = document.getElementById('extension-version');
if (versionElement) {
    versionElement.textContent = manifest.version;
}

const dependencies: Record<string, Record<string, any>> = {};

for (const option of OPTIONS) {
    insertOptionControl(option);
    storage.addListener(option.name, (change: any) => {
        updateDisplayedSetting(option.name, change.value);
    });
}
storage.load();

function updateDisplayedSetting(key: string, value: any): void {
    const element = document.getElementById(key);
    if (element && 'setValue' in element) {
        (element as any).setValue(value);
    }
    checkDependencies(key);
}


function checkDependencies(controlKey: string): void {
    let shouldEnable = true;
    if (controlKey in dependencies) {
        const controlDependencies = dependencies[controlKey];
        for (const key in controlDependencies) {
            const element = document.getElementById(key);
            if (element && 'getValue' in element && (element as any).getValue() !== controlDependencies[key]) {
                shouldEnable = false;
                break;
            }
        }
        enableControl(controlKey, shouldEnable);
    }
}

function enableControl(controlKey: string, enabled: boolean): void {
    const element = document.getElementById(controlKey) as HTMLInputElement;
    if (element) {
        element.disabled = !enabled;
    }
    const label = document.querySelector('.label[for="' + controlKey + '"]') as HTMLElement;
    if (label) {
        if (enabled) {
            label.classList.remove('disabled');
        } else {
            label.classList.add('disabled');
        }
    }
}

function insertOptionControl(option: any): void {
    const container = document.getElementById('settings');
    if (!container) return;

    const label = document.createElement('label');
    label.classList.add('label');
    label.textContent = option.label;
    label.htmlFor = option.name;
    container.append(label);

    const controlDiv = document.createElement('div');
    controlDiv.classList.add('control');

    let control: HTMLElement | null = null;
    if (option.type === 'checkbox') {
        control = createCheckbox(option);
    } else if (option.type === 'combobox') {
        control = createCombobox(option);
    }

    if (control) {
        controlDiv.append(control);
    }
    container.append(controlDiv);

    if (option.condition) {
        dependencies[option.name] = {};
        for (const key in option.condition) {
            dependencies[option.name][key] = option.condition[key];
            const depElement = document.getElementById(key);
            if (depElement) {
                depElement.addEventListener('change', () => {
                    checkDependencies(option.name);
                });
            }
        }
    }
}

function createCheckbox(option: any): HTMLInputElement {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = option.name;
    checkbox.checked = option.default;
    checkbox.addEventListener('change', () => {
        (storage as any)[option.storageArea][option.name] = checkbox.checked;
        // chrome.storage[option.storageArea].set({ [option.name]: checkbox.checked });
    });
    (checkbox as any).getValue = () => checkbox.checked;
    (checkbox as any).setValue = (value: boolean) => checkbox.checked = value;
    return checkbox;
}

function createCombobox(option: any): HTMLSelectElement {
    const combobox = document.createElement('select');
    combobox.id = option.name;
    for (const value of option.values) {
        const boxOption = document.createElement('option');
        boxOption.value = value;
        boxOption.textContent = value;
        if (value === option.default) {
            boxOption.selected = true;
        }
        combobox.append(boxOption);
    }
    combobox.addEventListener('change', () => {
        (storage as any)[option.storageArea][option.name] = combobox.value;
        // chrome.storage[option.storageArea].set({ [option.name]: combobox.value });
    });
    (combobox as any).getValue = () => combobox.value;
    (combobox as any).setValue = (value: string) => combobox.value = value;
    return combobox;
}