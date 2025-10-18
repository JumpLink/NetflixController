import * as S from "../../utils/storage-items";
import { OPTIONS, type Option } from "./settings.ts";

// Initialize values and change listeners
const manifest = browser.runtime.getManifest();
document.querySelectorAll(".extension-name").forEach((elem: Element) => {
	(elem as HTMLElement).textContent = manifest.name;
});
const versionElement = document.getElementById("extension-version");
if (versionElement) {
	versionElement.textContent = manifest.version;
}

const dependencies: Record<string, Record<string, unknown>> = {};

for (const option of OPTIONS) {
	insertOptionControl(option);
}

// Initial population from storage
Promise.all([
	S.showActionHints
		.get()
		.then((v) => updateDisplayedSetting("showActionHints", v ?? true)),
	S.buttonImageMapping
		.get()
		.then((v) => updateDisplayedSetting("buttonImageMapping", v ?? "Xbox One")),
	S.showConnectionHint
		.get()
		.then((v) => updateDisplayedSetting("showConnectionHint", v ?? true)),
	S.showCompatibilityWarning
		.get()
		.then((v) => updateDisplayedSetting("showCompatibilityWarning", v ?? true)),
]).catch((err) => console.error("Failed to load options from storage", err));

// Wire change listeners
S.showActionHints.onChanged((v) =>
	updateDisplayedSetting("showActionHints", v),
);
S.buttonImageMapping.onChanged((v) =>
	updateDisplayedSetting("buttonImageMapping", v),
);
S.showConnectionHint.onChanged((v) =>
	updateDisplayedSetting("showConnectionHint", v),
);
S.showCompatibilityWarning.onChanged((v) =>
	updateDisplayedSetting("showCompatibilityWarning", v),
);

function updateDisplayedSetting(key: string, value: unknown): void {
	const element = document.getElementById(key);
	if (element && "setValue" in element) {
		(element as { setValue: (value: unknown) => void }).setValue(value);
	}
	checkDependencies(key);
}

function checkDependencies(controlKey: string): void {
	let shouldEnable = true;
	if (controlKey in dependencies) {
		const controlDependencies = dependencies[controlKey];
		for (const key in controlDependencies) {
			const element = document.getElementById(key);
			if (
				element &&
				"getValue" in element &&
				(element as { getValue: () => unknown }).getValue() !==
					controlDependencies[key]
			) {
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
	const label = document.querySelector(
		`.label[for="${controlKey}"]`,
	) as HTMLElement;
	if (label) {
		if (enabled) {
			label.classList.remove("disabled");
		} else {
			label.classList.add("disabled");
		}
	}
}

function insertOptionControl(option: Option): void {
	const container = document.getElementById("settings");
	if (!container) return;

	const label = document.createElement("label");
	label.classList.add("label");
	label.textContent = option.label;
	label.htmlFor = option.name;
	container.append(label);

	const controlDiv = document.createElement("div");
	controlDiv.classList.add("control");

	let control: HTMLElement | null = null;
	if (option.type === "checkbox") {
		control = createCheckbox(option);
	} else if (option.type === "combobox") {
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
				depElement.addEventListener("change", () => {
					checkDependencies(option.name);
				});
			}
		}
	}
}

function createCheckbox(option: Option): HTMLInputElement {
	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.id = option.name;
	checkbox.checked = option.default as boolean;
	checkbox.addEventListener("change", () => {
		if (option.name === "showActionHints") {
			S.showActionHints.set(checkbox.checked);
		} else if (option.name === "showConnectionHint") {
			S.showConnectionHint.set(checkbox.checked);
		} else if (option.name === "showCompatibilityWarning") {
			S.showCompatibilityWarning.set(checkbox.checked);
		}
	});
	(
		checkbox as unknown as {
			getValue: () => boolean;
			setValue: (value: boolean) => void;
		}
	).getValue = () => checkbox.checked;
	(
		checkbox as unknown as {
			getValue: () => boolean;
			setValue: (value: boolean) => void;
		}
	).setValue = (value: boolean) => {
		checkbox.checked = value;
	};
	return checkbox;
}

function createCombobox(option: Option): HTMLSelectElement {
	const combobox = document.createElement("select");
	combobox.id = option.name;
	for (const value of option.values ?? []) {
		const boxOption = document.createElement("option");
		boxOption.value = value;
		boxOption.textContent = value;
		if (value === option.default) {
			boxOption.selected = true;
		}
		combobox.append(boxOption);
	}
	combobox.addEventListener("change", () => {
		if (option.name === "buttonImageMapping") {
			S.buttonImageMapping.set(combobox.value);
		}
	});
	(
		combobox as unknown as {
			getValue: () => string;
			setValue: (value: string) => void;
		}
	).getValue = () => combobox.value;
	(
		combobox as unknown as {
			getValue: () => string;
			setValue: (value: string) => void;
		}
	).setValue = (value: string) => {
		combobox.value = value;
	};
	return combobox;
}
