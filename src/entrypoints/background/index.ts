import type {
	BrowserTab,
	RuntimeInstalledDetails,
	TabChangeInfo,
} from "../../types/browser";
import * as S from "../../utils/storage-items";
// import { OPTIONS } from "../options/settings.js";

export default defineBackground(() => {
	console.log("[background] service worker started (MV3)");
	// Initialize extension
	browser.runtime.onInstalled.addListener(
		(details: RuntimeInstalledDetails) => {
			if (details.reason === "install") {
				setDefaultSettings();
			}
			// In MV3, we don't need declarativeContent anymore
			// The action will be available on all tabs
		},
	);

	browser.runtime.onStartup.addListener(() => {
		console.log("[background] onStartup");
	});

	// Set default settings
	function setDefaultSettings() {
		// Only set defaults if not set yet
		S.showActionHints.has().then((has) => {
			if (!has) S.showActionHints.set(true);
		});
		S.buttonImageMapping.has().then((has) => {
			if (!has) S.buttonImageMapping.set("Xbox One");
		});
		S.showConnectionHint.has().then((has) => {
			if (!has) S.showConnectionHint.set(true);
		});
		S.showCompatibilityWarning.has().then((has) => {
			if (!has) S.showCompatibilityWarning.set(true);
		});
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
