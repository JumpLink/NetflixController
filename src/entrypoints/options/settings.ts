export interface OptionCondition {
	[key: string]: unknown;
}

export interface Option {
	label: string;
	name: string;
	storageArea: "sync" | "local";
	type: "checkbox" | "combobox";
	default: boolean | string | unknown;
	values?: string[];
	condition?: Record<string, unknown>;
}

export const OPTIONS: Option[] = [
	{
		label: "Show gamepad interaction hints",
		name: "showActionHints",
		storageArea: "sync",
		type: "checkbox",
		default: true,
	},
	{
		label: "Gamepad button icon images",
		name: "buttonImageMapping",
		storageArea: "sync",
		type: "combobox",
		values: ["Xbox 360", "Xbox One", "PS3", "PS4", "Switch"],
		default: "Xbox One",
		condition: {
			showActionHints: true,
		},
	},
	{
		label: "Show gamepad connection hint when no gamepad is connected",
		name: "showConnectionHint",
		storageArea: "local",
		type: "checkbox",
		default: true,
	},
	{
		label: "Show non-standard gamepad compatibility warning",
		name: "showCompatibilityWarning",
		storageArea: "local",
		type: "checkbox",
		default: true,
	},
];
