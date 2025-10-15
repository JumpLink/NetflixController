/** biome-ignore-all lint/suspicious/noExplicitAny lint/complexity/noBannedTypes: Storage interfaces use any types for dynamic property access and Function types for flexible listener callbacks required by browser storage APIs. */

// Storage related types

export interface StorageListener {
	callback: Function;
	options: {
		area?: string;
		onLoad?: boolean;
	};
}

export interface StorageChanges {
	[key: string]: {
		oldValue?: any;
		newValue?: any;
		value?: any;
	};
}
