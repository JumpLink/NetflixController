import type {
	BrowserTab,
	RuntimeInstalledDetails,
	TabChangeInfo,
} from "../../types/browser";
import type { LiveStorageInstance } from "../../types/storage";
import LiveStorage from "../../utils/live-storage.ts";
import { OPTIONS } from "../options/settings.js";

export default defineBackground(() => {
	const storage: LiveStorageInstance = LiveStorage;

	// Initialize extension
	browser.runtime.onInstalled.addListener(
		(details: RuntimeInstalledDetails) => {
			if (details.reason === "install") {
				storage.load().then(() => setDefaultSettings());
				setDefaultSettings();
			}
			// In MV3, we don't need declarativeContent anymore
			// The action will be available on all tabs
		},
	);

	browser.runtime.onStartup.addListener(() => {
		storage.load();
	});

	// Set default settings
	function setDefaultSettings() {
		for (const option of OPTIONS) {
			storage[option.storageArea][option.name] = option.default;
		}
	}

	// Inform the content script of any changes to the Netflix's URL path
	browser.tabs.onUpdated.addListener(
		(tabId: number, changeInfo: TabChangeInfo, tab: BrowserTab) => {
			if (
				tab.active &&
				tab.status === "complete" &&
				changeInfo.status &&
				changeInfo.status === "complete" &&
				tab.url
			) {
				try {
					const url = new URL(tab.url);
					if (
						url.hostname.endsWith(".netflix.com") &&
						!url.hostname.startsWith("help.")
					) {
						browser.tabs
							.sendMessage(tabId, {
								message: "locationChanged",
								path: url.pathname,
							})
							.catch(() => {
								// Ignore errors when content script is not ready
							});
					}
				} catch (_e) {
					// Ignore invalid URLs
				}
			}
		},
	);

	// Handle action clicks (when user clicks the extension icon)
	browser.action.onClicked.addListener(async (tab: BrowserTab) => {
		if (tab.url?.includes("netflix.com") && tab.id !== undefined) {
			try {
				await browser.scripting.executeScript({
					target: { tabId: tab.id },
					files: ["app/content/content.js"],
				});
			} catch (e) {
				console.log("Could not inject content script:", e);
			}
		}
	});
});
