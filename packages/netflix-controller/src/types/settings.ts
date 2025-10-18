// Settings and options types

export interface OptionCondition {
	[key: string]: unknown;
}

export interface Option {
	label: string;
	name: string;
	storageArea: "sync" | "local" | "managed";
	type: "checkbox" | "combobox";
	default: boolean | string | unknown;
	values?: string[];
	condition?: OptionCondition;
}

export type OptionsArray = Option[];

export interface Settings {
	showActionHints: boolean;
	buttonImageMapping: string;
	showConnectionHint: boolean;
	showCompatibilityWarning: boolean;
}
