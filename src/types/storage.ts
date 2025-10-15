// Storage related types

export interface StorageListener {
	callback: (value: unknown) => void;
	options: {
		area?: string;
		onLoad?: boolean;
	};
}

export interface StorageChanges {
	[key: string]: {
		oldValue?: unknown;
		newValue?: unknown;
		value?: unknown;
	};
}
