import { StorageItem } from "webext-storage";

// Typed storage items for all user options/settings

export const showActionHints = new StorageItem<boolean>("showActionHints", {
	area: "sync",
	defaultValue: true,
});

export const buttonImageMapping = new StorageItem<string>(
	"buttonImageMapping",
	{
		area: "sync",
		defaultValue: "Xbox One",
	},
);

export const showConnectionHint = new StorageItem<boolean>(
	"showConnectionHint",
	{
		area: "local",
		defaultValue: true,
	},
);

export const showCompatibilityWarning = new StorageItem<boolean>(
	"showCompatibilityWarning",
	{
		area: "local",
		defaultValue: true,
	},
);
