// Service Worker for Netflix Controller (Manifest V3)
importScripts('../../static/js/live-storage@1.0.2.js');
importScripts('../options/settings.js');

const storage = LiveStorage;

// Initialize extension
chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
        storage.load().then(() => setDefaultSettings());
        setDefaultSettings();
    }
    // In MV3, we don't need declarativeContent anymore
    // The action will be available on all tabs
});

chrome.runtime.onStartup.addListener(() => {
    storage.load();
});

// Set default settings
function setDefaultSettings() {
    for (let option of OPTIONS) {
        storage[option.storageArea][option.name] = option.default;
    }
}

// Inform the content script of any changes to the Netflix's URL path
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active && tab.status === 'complete' && changeInfo.status && changeInfo.status === 'complete') {
        try {
            let url = new URL(tab.url);
            if (url.hostname.endsWith('.netflix.com') && !url.hostname.startsWith('help.')) {
                chrome.tabs.sendMessage(tabId, {
                    message: 'locationChanged',
                    path: url.pathname
                }).catch(() => {
                    // Ignore errors when content script is not ready
                });
            }
        } catch (e) {
            // Ignore invalid URLs
        }
    }
});

// Handle action clicks (when user clicks the extension icon)
chrome.action.onClicked.addListener(async (tab) => {
    if (tab.url && tab.url.includes('netflix.com')) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["app/content/content.js"]
            });
        } catch (e) {
            console.log('Could not inject content script:', e);
        }
    }
});
