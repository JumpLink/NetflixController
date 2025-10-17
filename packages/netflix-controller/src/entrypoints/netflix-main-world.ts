/**
 * Netflix API Main World Bridge
 * This script runs in the main world (not isolated) to access Netflix's internal API
 *
 */

import type { NetflixDebugTools } from "../../env";
import {
	exploreAPI,
	exportAll,
	getAllSessions,
	getFullAPI,
	getSessionInfo,
	getTimecodes,
	testVideoPlayerMethods,
} from "./netflix-api/debug";
// Import the modular functions
import {
	getPlaybackStatus,
	getPlayer,
	seekBackward,
	seekForward,
	toggleMute,
	togglePlayPause,
	volumeDown,
	volumeUp,
} from "./netflix-api/player-controls";

export default defineUnlistedScript({
	main() {
		console.log("[DEBUG] Netflix debug tools script loaded in main world");

		// Wait for Netflix API to be available
		const checkNetflixAPI = () => {
			if (window.netflix?.appContext?.state?.playerApp) {
				console.log("[DEBUG] Netflix API detected, setting up debug tools");
				initializeDebugTools();
			} else {
				console.log(
					"[DEBUG] Netflix API not yet available, retrying in 500ms...",
				);
				setTimeout(checkNetflixAPI, 500);
			}
		};

		function initializeDebugTools() {
			if (window.netflixDebug) {
				console.log("[DEBUG] Netflix debug tools already initialized");
				return;
			}

			window.netflixDebug = {
				// Player Control Functions
				getPlayer: () => getPlayer(),
				togglePlayPause: () => togglePlayPause(),
				toggleMute: () => toggleMute(),
				seekForward: (seconds?: number) => seekForward(seconds),
				seekBackward: (seconds?: number) => seekBackward(seconds),
				volumeUp: (delta?: number) => volumeUp(delta),
				volumeDown: (delta?: number) => volumeDown(delta),
				getPlaybackStatus: () => getPlaybackStatus(),

				// Debug Functions
				getFullAPI: () => getFullAPI(),
				exploreAPI: () => exploreAPI(),
				getAllSessions: () => getAllSessions(),
				getSessionInfo: () => getSessionInfo(),
				getTimecodes: () => getTimecodes(),
				testVideoPlayerMethods: () => testVideoPlayerMethods(),
				exportAll: () => exportAll(),
			};

			console.log(
				"[DEBUG] Netflix debug tools initialized and available via window.netflixDebug",
			);
			console.log("Available methods:");
			console.log("  - netflixDebug.exploreAPI() - Show API structure");
			console.log(
				"  - netflixDebug.getSessionInfo() - Get current session info",
			);
			console.log(
				"  - netflixDebug.getAllSessions() - List all player sessions",
			);
			console.log(
				"  - netflixDebug.getTimecodes() - Get skip intro/credits timecodes",
			);
			console.log(
				"  - netflixDebug.testVideoPlayerMethods() - Test all methods",
			);
			console.log("  - netflixDebug.togglePlayPause() - Toggle play/pause");
			console.log("  - netflixDebug.toggleMute() - Toggle mute");
			console.log("  - netflixDebug.seekForward(seconds) - Seek forward");
			console.log("  - netflixDebug.seekBackward(seconds) - Seek backward");
			console.log("  - netflixDebug.volumeUp(delta) - Increase volume");
			console.log("  - netflixDebug.volumeDown(delta) - Decrease volume");
			console.log("  - netflixDebug.exportAll() - Export everything as JSON");
			console.log("  - netflixDebug.getFullAPI() - Get raw API object");

			// Message handler for communication with content script
			console.log(
				"[DEBUG] Setting up message handler for content script communication",
			);
			window.addEventListener("message", (event: MessageEvent) => {
				// Only accept messages from our own extension
				if (event.source !== window) return;
				if (event.data?.type !== "netflix-controller-command") return;

				const { command, args = [], requestId } = event.data;
				console.log("[NETFLIX-COMMAND]", command, args);

				try {
					let result: unknown;
					if (
						typeof window.netflixDebug[command as keyof NetflixDebugTools] ===
						"function"
					) {
						result = (window.netflixDebug as NetflixDebugTools)[
							command as keyof NetflixDebugTools
						](...(args as []));
					} else {
						result = { success: false, error: `Unknown command: ${command}` };
					}

					// Send response back to content script
					window.postMessage(
						{
							type: "netflix-controller-response",
							requestId,
							result,
						},
						"*",
					);
				} catch (error) {
					console.error(
						"[NETFLIX-COMMAND] Error executing command:",
						command,
						error,
					);
					window.postMessage(
						{
							type: "netflix-controller-response",
							requestId,
							result: { success: false, error: String(error) },
						},
						"*",
					);
				}
			});
		}

		// Start checking
		checkNetflixAPI();
	},
});
