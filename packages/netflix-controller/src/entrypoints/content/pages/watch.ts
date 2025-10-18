import { GAMEPAD_BUTTONS } from "@ribajs/gamecontroller.js";
import type { NavigationAction } from "../../../types/components";
import type { Settings } from "../../../types/settings";
import * as S from "../../../utils/storage-items";
import { ActionHandler } from "../ui/actions.js";
import { NavigatablePage } from "./page.ts";

export class WatchVideo extends NavigatablePage {
	player: Element | null;
	actionHandler: ActionHandler;
	settings: Settings;

	constructor() {
		super();
		this.player = null;
		this.settings = {
			showActionHints: true,
			buttonImageMapping: "Xbox Series",
			showConnectionHint: false,
			showCompatibilityWarning: false,
		};
		this.actionHandler = new ActionHandler(this.settings);

		// Load settings from storage
		this.loadSettingsFromStorage();

		console.log("[WATCH] Netflix watch page handler initialized");
	}

	private async loadSettingsFromStorage(): Promise<void> {
		try {
			const [showActionHints, buttonImageMapping] = await Promise.all([
				S.showActionHints.get(),
				S.buttonImageMapping.get(),
			]);

			this.settings.showActionHints = showActionHints ?? true;
			this.settings.buttonImageMapping = buttonImageMapping ?? "Xbox Series";

			// Update action handler with loaded settings
			this.actionHandler = new ActionHandler(this.settings);
			this.actionHandler.addAll(this.getActions());

			console.log("[WATCH] Settings loaded from storage:", this.settings);
		} catch (error) {
			console.warn("[WATCH] Failed to load settings from storage:", error);
		}
	}

	static validatePath(path: string): boolean {
		return path.startsWith("/watch");
	}

	onLoad(): void {
		console.log("[WATCH] Netflix watch page loaded");
		super.onLoad();

		// Find player element for keyboard fallback
		this.player = document.querySelector('[data-uia="player"]') || null;

		console.log("[WATCH] Player element found:", !!this.player);
	}

	onUnload(): void {
		this.actionHandler.removeAll(this.getActions());
		super.onUnload();
		console.log("[WATCH] Netflix watch page unloaded");
	}

	isPageReady(): boolean {
		const hasVideo = document.querySelector("video") !== null;
		const isWatchPage = window.location.pathname.includes("/watch");

		const isReady = isWatchPage && hasVideo;

		console.log("[WATCH] Page ready check:", {
			hasVideo,
			isWatchPage,
			isReady,
		});

		return isReady;
	}

	getActions(): NavigationAction[] {
		console.log("[WATCH] getActions called");
		return [
			{
				label: "Play/Pause",
				index: GAMEPAD_BUTTONS.BUTTON_BOTTOM,
				onPress: () => this.togglePlayPause(),
			},
			{
				label: "Mute",
				index: GAMEPAD_BUTTONS.BUTTON_LEFT,
				onPress: () => this.toggleMute(),
			},
			{
				label: "Fullscreen",
				index: GAMEPAD_BUTTONS.BUTTON_TOP,
				onPress: () => this.toggleFullscreen(),
			},
			{
				label: "Back",
				index: GAMEPAD_BUTTONS.BUTTON_RIGHT,
				onPress: () => this.goBack(),
			},
			{
				label: "Seek Back 10s",
				index: GAMEPAD_BUTTONS.D_PAD_LEFT,
				onPress: () => this.seekBackward(10),
			},
			{
				label: "Seek Forward 10s",
				index: GAMEPAD_BUTTONS.D_PAD_RIGHT,
				onPress: () => this.seekForward(10),
			},
			{
				label: "Volume Down",
				index: GAMEPAD_BUTTONS.D_PAD_BOTTOM,
				onPress: () => this.volumeDown(),
			},
			{
				label: "Volume Up",
				index: GAMEPAD_BUTTONS.D_PAD_UP,
				onPress: () => this.volumeUp(),
			},
		];
	}

	// ===== PLAYER CONTROL METHODS =====
	// Primary: Netflix API via message bridge
	// Fallback: Keyboard events on player element

	async togglePlayPause(): Promise<void> {
		console.log("[WATCH] Executing togglePlayPause");

		try {
			// Get initial status
			const initialStatus = await this.sendNetflixCommand("getPlaybackStatus");
			const wasPaused = initialStatus?.isPaused;
			console.log("[WATCH] Initial playback status:", { wasPaused });

			// Send toggle command
			const toggleResult = await this.sendNetflixCommand("togglePlayPause");

			if (toggleResult?.success) {
				// Wait a bit for the change to take effect, then verify
				setTimeout(async () => {
					try {
						const finalStatus =
							await this.sendNetflixCommand("getPlaybackStatus");
						const isNowPaused = finalStatus?.isPaused;

						if (isNowPaused !== wasPaused) {
							console.log(
								"[WATCH] Netflix API togglePlayPause successful - status changed from",
								wasPaused,
								"to",
								isNowPaused,
							);
						} else {
							console.log(
								"[WATCH] Netflix API togglePlayPause failed - status didn't change, using keyboard fallback",
							);
							this.dispatchKey(32); // Space key
						}
					} catch {
						console.log(
							"[WATCH] Could not verify status change, assuming API worked",
						);
					}
				}, 100); // Small delay to let the API call take effect
			} else {
				console.log("[WATCH] Netflix API failed, using keyboard fallback");
				this.dispatchKey(32); // Space key
			}
		} catch (error) {
			console.warn(
				"[WATCH] Could not get initial status, using keyboard fallback:",
				error,
			);
			this.dispatchKey(32); // Space key
		}
	}

	async toggleMute(): Promise<void> {
		console.log("[WATCH] Executing toggleMute");

		try {
			const result = await this.sendNetflixCommand("toggleMute");
			if (result?.success) {
				console.log("[WATCH] Netflix API toggleMute successful");
			} else {
				console.log("[WATCH] Netflix API failed, using keyboard fallback");
				this.dispatchKey(77); // M key
			}
		} catch (error) {
			console.warn(
				"[WATCH] Message bridge failed, using keyboard fallback:",
				error,
			);
			this.dispatchKey(77); // M key
		}
	}

	async seekForward(seconds: number = 10): Promise<void> {
		console.log("[WATCH] Executing seekForward");

		try {
			const result = await this.sendNetflixCommand("seekForward", seconds);
			if (result?.success) {
				console.log("[WATCH] Netflix API seekForward successful");
			} else {
				console.log("[WATCH] Netflix API failed, using keyboard fallback");
				this.dispatchKey(39); // Right arrow
			}
		} catch (error) {
			console.warn(
				"[WATCH] Message bridge failed, using keyboard fallback:",
				error,
			);
			this.dispatchKey(39); // Right arrow
		}
	}

	async seekBackward(seconds: number = 10): Promise<void> {
		console.log("[WATCH] Executing seekBackward");

		try {
			const result = await this.sendNetflixCommand("seekBackward", seconds);
			if (result?.success) {
				console.log("[WATCH] Netflix API seekBackward successful");
			} else {
				console.log("[WATCH] Netflix API failed, using keyboard fallback");
				this.dispatchKey(37); // Left arrow
			}
		} catch (error) {
			console.warn(
				"[WATCH] Message bridge failed, using keyboard fallback:",
				error,
			);
			this.dispatchKey(37); // Left arrow
		}
	}

	async volumeUp(delta: number = 0.1): Promise<void> {
		console.log("[WATCH] Executing volumeUp");

		try {
			const result = await this.sendNetflixCommand("volumeUp", delta);
			if (result?.success) {
				console.log("[WATCH] Netflix API volumeUp successful");
			} else {
				console.log("[WATCH] Netflix API failed, using keyboard fallback");
				this.dispatchKey(38); // Up arrow
			}
		} catch (error) {
			console.warn(
				"[WATCH] Message bridge failed, using keyboard fallback:",
				error,
			);
			this.dispatchKey(38); // Up arrow
		}
	}

	async volumeDown(delta: number = 0.1): Promise<void> {
		console.log("[WATCH] Executing volumeDown");

		try {
			const result = await this.sendNetflixCommand("volumeDown", delta);
			if (result?.success) {
				console.log("[WATCH] Netflix API volumeDown successful");
			} else {
				console.log("[WATCH] Netflix API failed, using keyboard fallback");
				this.dispatchKey(40); // Down arrow
			}
		} catch (error) {
			console.warn(
				"[WATCH] Message bridge failed, using keyboard fallback:",
				error,
			);
			this.dispatchKey(40); // Down arrow
		}
	}

	toggleFullscreen(): void {
		// Try to find the fullscreen element
		const fullscreenElement =
			document.querySelector('[data-uia="player"]') || document.body;

		// Toggle fullscreen
		if (!document.fullscreenElement && fullscreenElement) {
			fullscreenElement.requestFullscreen().catch((err) => {
				console.warn(`Unable to switch to fullscreen mode: ${err}`);
			});
		} else {
			document.exitFullscreen().catch((err) => {
				console.warn(`Unable to exit fullscreen mode: ${err}`);
			});
		}
	}

	goBack(): void {
		console.log("[WATCH] Going back using browser history");
		// Simple back navigation using browser history
		window.history.back();
	}

	dispatchKey(keyCode: number): void {
		const event = new KeyboardEvent("keydown", {
			key: String.fromCharCode(keyCode),
			keyCode: keyCode,
			bubbles: true,
			cancelable: true,
			view: window,
		});
		if (this.player) {
			this.player.dispatchEvent(event);
		}
	}

	// ===== MESSAGE BRIDGE =====

	sendNetflixCommand(
		command: string,
		...args: unknown[]
	): Promise<Record<string, unknown>> {
		return new Promise((resolve) => {
			const requestId = Date.now() + Math.random();

			// Listen for response
			const responseHandler = (event: MessageEvent) => {
				if (
					event.data?.type === "netflix-controller-response" &&
					event.data.requestId === requestId
				) {
					window.removeEventListener("message", responseHandler);
					resolve(event.data.result);
				}
			};

			window.addEventListener("message", responseHandler);

			// Send command to main world
			window.postMessage(
				{
					type: "netflix-controller-command",
					command,
					args,
					requestId,
				},
				"*",
			);

			// Timeout after 5 seconds
			setTimeout(() => {
				window.removeEventListener("message", responseHandler);
				resolve({ success: false, error: "Timeout" });
			}, 5000);
		});
	}
}
