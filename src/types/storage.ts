// Storage related types

export interface StorageListener {
    callback: Function;
    options: {
        area?: string;
        onLoad?: boolean;
    };
}

export interface LiveStorageInstance {
    loaded: boolean;
    load(options?: object): Promise<void>;
    addListener(key: string, callback: Function, options?: object): void;
    removeListener(key: string, callback: Function, options?: object): void;
    sync: Record<string, any>;
    local: Record<string, any>;
    managed: Record<string, any>;
}

export interface StorageChanges {
    [key: string]: {
        oldValue?: any;
        newValue?: any;
        value?: any;
    };
}
