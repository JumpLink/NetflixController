/**
 * Source: https://github.com/FThompson/browserLiveStorage
 *
 * MIT License
 * 
 * Copyright (c) 2019 Finn Thompson
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * This module defines a live storage object that maintains an up-to-date
 * representation of browser.storage user data.
 */

interface StorageListener {
    callback: Function;
    options: {
        area?: string;
        onLoad?: boolean;
    };
}

interface StorageProxy {
    [key: string]: any;
}

const LiveStorage = (() => {
    let loaded = false;
    let updating = false; // flag to avoid infinite call stack when saving data
    const listeners: Record<string, StorageListener[]> = {};
    const storage: Record<string, any> = {
        sync: buildStorageProxy('sync'),
        local: buildStorageProxy('local'),
        managed: buildStorageProxy('managed')
    };

    /**
     * Adds a listener that calls a given callback when a given key's value
     * changes.
     */
    function addListener(key: string, callback: Function, options: { area?: string; onLoad?: boolean } = {}): void {
        let defaults = { onLoad: true };
        options = Object.assign(defaults, options);
        if (!(key in listeners)) {
            listeners[key] = [];
        }
        listeners[key].push({ callback, options });
    }

    /**
     * Removes the given callback bound to a given key.
     */
    function removeListener(key: string, callback: Function, options?: { area?: string }): void {
        if (key in listeners) {
            listeners[key] = listeners[key].filter(listener => {
                if (options?.area && options.area !== listener.options.area) {
                    return false;
                }
                return listener.callback !== callback;
            });
        }
    }

    /**
     * Updates the local storage object and calls applicable listeners.
     */
    function update(changes: Record<string, any>, areaName: string): void {
        // identify changes
        let added: Record<string, any> = {};
        let removedKeys: string[] = [];
        for (let key in changes) {
            if ('newValue' in changes[key]) {
                added[key] = changes[key].newValue;
                changes[key].value = changes[key].newValue;
            } else {
                removedKeys.push(key);
            }
        }
        // apply changes
        updating = true;
        Object.assign(storage[areaName], added);
        for (let key of removedKeys) {
            delete storage[areaName][key];
        }
        updating = false;
        // call listeners after updating storage objects
        for (let key in changes) {
            if (key in listeners) {
                callListeners(key, changes[key], areaName, false);
            }
        }
    }

    /**
     * Calls listeners registered with live storage.
     * 
     * @param {String} key The key to call listeners for.
     * @param {Object} change The change object containing new/old values.
     * @param {String} areaName The name of the storage area that changed.
     * @param {Boolean} isLoad true if onLoad listeners should be called.
     */
    function callListeners(key: string, change: any, areaName: string, isLoad: boolean): void {
        for (let listener of listeners[key]) {
            if (isLoad && !listener.options.onLoad) {
                continue;
            }
            if (listener.options.area && listener.options.area !== areaName) {
                continue;
            }
            listener.callback(change);
        }
    }

    /**
     * Async loads data from browser.storage and calls applicable callbacks.
     * 
     * @param {Object} options Optional options:
     *  - {Object} areas The areas to load data into, where the keys are
     *             area names and values are booleans.
     *             Defaults to load all three: sync, local, managed.
     */
    async function load(options: { sync?: boolean; local?: boolean; managed?: boolean } = {}): Promise<void> {
        if (loaded) {
            // return instantly instead of loading again
            return Promise.resolve();
        }
        let defaultAreas = { sync: true, local: true, managed: true };
        let requests = [];
        for (let area in defaultAreas) {
            requests.push(new Promise((resolve, reject) => {
                // TODO test this, add options[hard load]
                let shouldFetch = (defaultAreas as any)[area];
                if ('areas' in options && area in (options.areas as any)) {
                    shouldFetch = (options.areas as any)[area];
                }
                if (shouldFetch) {
                    (browser.storage as any)[area].get(null, (items: any) => {
                        if (browser.runtime.lastError) {
                            reject({ error: browser.runtime.lastError.message });
                        }
                        resolve({ area, items });
                    });
                } else {
                    resolve({ area, items: {} });
                }
            }));
        }
        return Promise.all(requests).then(results => {
            browser.storage.onChanged.addListener(update);
            // add loaded data into storage objects
            updating = true;
            for (let result of results) {
                Object.assign(storage[(result as any).area], (result as any).items);
            }
            updating = false;
            loaded = true;
            // call listeners after updating storage objects
            for (let area in storage) {
                for (let key in storage[area]) {
                    if (key in listeners) {
                        let change = { value: storage[area][key] };
                        callListeners(key, change, area, true);
                    }
                }
            }
        });
    }

    /**
     * Creates a storage data object proxy that calls browser.storage functions
     * when modifying storage data. This proxy also enforces read-only access
     * for the "managed" browser.storage area.
     * 
     * @param {String} areaName The area name of the wrapped storage object.
     */
    function buildStorageProxy(areaName: string): StorageProxy {
        return new Proxy({}, {
            get: (store: any, key: string | symbol) => {
                if (!loaded) {
                    throw new Error('LiveStorage not yet loaded');
                }
                return store[key];
            },
            set: (store: any, key: string | symbol, value: any) => {
                checkManaged(areaName);
                let prev = store[key];
                store[key] = value;
                if (!updating) {
                    (browser.storage as any)[areaName].set({ [key as string]: value }, () => {
                        checkError('set', areaName, key as string, value, prev);
                    });
                }
                return true;
            },
            deleteProperty: (store: any, key: string | symbol) => {
                checkManaged(areaName);
                let prev = store[key];
                delete store[key];
                if (!updating) {
                    (browser.storage as any)[areaName].remove(key as string, () => {
                        checkError('remove', areaName, key as string, undefined, prev);
                    });
                }
                return true;
            }
        });
    }

    /**
     * Checks if a browser.runtime error occurred and if so, reverts the live
     * storage to undo the change on which the error occurred. This function
     * also calls onError, passing the error message and error content info.
     * 
     * @param {String} action The action during which the error occurred.
     * @param {String} area The name of the storage area used in the action.
     * @param {String} key The key used in the action.
     * @param {Any} value The value used in the action.
     * @param {Any} previousValue The previous value, to revert the value to.
     */
    function checkError(action: string, area: string, key: string | undefined, value: any, previousValue: any): void {
        if (browser.runtime.lastError) {
            updating = true;
            if (key !== undefined) {
                storage[area][key] = previousValue;
            }
            updating = false;
            const safeKey = key || '';
            onError(browser.runtime.lastError.message || 'Unknown error', { action, area, key: safeKey, value, previousValue } as any);
        }
    }

    /**
     * Checks if the given area is the read-only browser.storage.managed area.
     */
    function checkManaged(areaName: string): void {
        if (areaName === 'managed') {
            throw new Error('browser.storage.managed is read-only');
        }
    }

    /**
     * Handles errors that occur in browser.storage set/remove function calls.
     * This function should be defined to supply users with meaningful error
     * messages. The default implementation shows a console warning.
     * 
     * @param {String} message The message from `browser.runtime.lastError`.
     * @param {Object} info Info containing the area, key, and value for which
     *                      the error occurred. Use these values to plan how to
     *                      avoid the error during future invocations.
     */
    function onError(message: string, info: { action: string; area: string; key?: string; value?: any; previousValue?: any }): void {
        console.warn(message, info);
    }

    /**
     * The LiveStorage public contract, with unmodifiable storage objects.
     * The explicit onError get/set functions are required due to module scope.
     */
    return {
        load,
        addListener,
        removeListener,
        get sync() { return storage.sync; },
        get local() { return storage.local; },
        get managed() { return storage.managed; },
        get onError() { return onError; },
        set onError(_fn: any) { /* onError setter disabled */ },
        get loaded() { return loaded; }
    }
})();

// ESM export
export default LiveStorage;