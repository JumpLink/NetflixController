/** biome-ignore-all lint/suspicious/noExplicitAny: Content script handles dynamic gamepad events, keyboard interactions, and browser APIs requiring flexible typing for event handlers and global exports. */
import type { NavigationAction } from "../../types/components";
import type { GamepadState } from "../../types/gamepad";
import type { ContentScriptMessage } from "../../types/messages";
import type { Settings } from "../../types/settings";
import { gamepadMappings } from "../../utils/gamepad-icons.ts";
import { gamepads, StandardMapping } from "../../utils/gamepads.ts";
import * as S from "../../utils/storage-items";

// Import CSS - WXT will automatically add this to the manifest
import "../../../public/assets/styles/content.css";

// Components
import { DIRECTION } from "./components/direction.js";
import { Navigatable } from "./components/navigatable.js";
// Page handlers
import { ChooseProfile } from "./pages/choose-profile.js";
import { FeaturedBrowse } from "./pages/featured-browse.js";
import { FeaturelessBrowse } from "./pages/featureless-browse.js";
import { LatestBrowse } from "./pages/latest-browse.js";
import type { NavigatablePage } from "./pages/page";
import { SearchBrowse } from "./pages/search.js";
import { TitleBrowse } from "./pages/title-browse.js";
import { WatchVideo } from "./pages/watch.js";
// UI components
import { ActionHandler } from "./ui/actions.js";
import { CompatibilityWarningBar as CompatibilityWarningBarImpl } from "./ui/compatibility-warning.js";
import { ConnectionHintBar as ConnectionHintBarImpl } from "./ui/connection-hint.js";
import { ErrorBar as ErrorBarImpl } from "./ui/error-bar.js";
import { VirtualKeyboard as VirtualKeyboardImpl } from "./ui/virtual-keyboard.js";

export default defineContentScript({
	matches: ["*://*.netflix.com/*"],
	main() {
		const ERROR_ALERT_DURATION = 10000;
		const NETFLIX_RED = "rgba(229, 9, 20)";

		function getTransparentNetflixRed(opacity: number): string {
			return NETFLIX_RED.replace(")", `, ${opacity})`);
		}

		gamepadMappings.buttonsPath = "assets/buttons";

		let currentPath: string | null = null;
		let numGamepads = 0;
		let hasConnectedGamepad = false;
		let keyboard: VirtualKeyboardImpl | null = null;
		const handlerHistory: string[] = [];
		let currentHandler: NavigatablePage | null = null;
		const settings: Settings = {
			showActionHints: true,
			buttonImageMapping: "Xbox One",
			showConnectionHint: true,
			showCompatibilityWarning: true,
		};
		const actionHandler = new ActionHandler(settings);
		const connectionHintBar = new ConnectionHintBarImpl();
		const compatibilityWarning = new CompatibilityWarningBarImpl();
		const errorBar = new ErrorBarImpl();
		const pageHandlers: any[] = [
			ChooseProfile,
			FeaturedBrowse,
			FeaturelessBrowse,
			LatestBrowse,
			TitleBrowse,
			SearchBrowse,
			WatchVideo,
		];

		const searchAction: NavigationAction = {
			label: "Search",
			index: StandardMapping.Button.BUTTON_TOP,
			onPress: openSearch,
		};

		const backAction: NavigationAction = {
			label: "Back",
			index: StandardMapping.Button.BUTTON_RIGHT,
			onPress: goBack,
		};

		// Initialize settings from storage and wire change listeners
		Promise.all([
			S.showActionHints.get().then((v) => {
				settings.showActionHints = v ?? true;
			}),
			S.buttonImageMapping.get().then((v) => {
				settings.buttonImageMapping = v ?? "Xbox One";
			}),
			S.showConnectionHint.get().then((v) => {
				settings.showConnectionHint = v ?? true;
			}),
			S.showCompatibilityWarning.get().then((v) => {
				settings.showCompatibilityWarning = v ?? true;
			}),
		])
			.then(() => {
				showConnectionHint();
				showActionHints();
				updateCompatibility();
			})
			.catch((err) => {
				console.error("Failed to initialize settings", err);
			});

		S.showActionHints.onChanged((val) => {
			settings.showActionHints = val;
			showActionHints();
		});
		S.buttonImageMapping.onChanged((val) => {
			settings.buttonImageMapping = val;
			actionHandler.updateHints();
		});
		S.showConnectionHint.onChanged((val) => {
			settings.showConnectionHint = val;
			showConnectionHint();
		});
		S.showCompatibilityWarning.onChanged((val) => {
			settings.showCompatibilityWarning = val;
			updateCompatibility();
		});

		browser.runtime.onMessage.addListener(
			(
				request: ContentScriptMessage,
				_sender: unknown,
				_sendResponse: unknown,
			) => {
				if (request.message === "locationChanged") {
					if (hasConnectedGamepad) {
						// load plugin core only if user is using gamepad in this session
						runHandler(request.path);
					}
				} else if (request.message === "disableGamepadInput") {
					gamepads.stop();
				} else if (request.message === "enableGamepadInput") {
					gamepads.start();
				}
			},
		);

		async function runHandler(path: string, forceLoad: boolean = false) {
			if (forceLoad || path !== currentPath) {
				unload();
				refreshPageIfBad();
				let found = false;
				for (let i = 0; !found && i < pageHandlers.length; i++) {
					if ((pageHandlers[i] as any).validatePath(path)) {
						log(`Loading ${(pageHandlers[i] as any).name} module for ${path}`);
						await loadPage(pageHandlers[i]);
						found = true;
					}
				}
				if (!found) {
					warn(`No module found for ${path}`);
				}
				currentPath = path;
			}
		}

		async function loadPage(handlerClass: any) {
			currentHandler = new handlerClass();
			if (currentHandler?.hasPath()) {
				addHistory();
			}
			setPageActions();
			try {
				if (currentHandler) {
					await currentHandler.load();
				}
			} catch (error) {
				showError(error instanceof Error ? error : new Error(String(error)));
			}
		}

		function unload() {
			if (currentHandler) {
				currentHandler.unload();
				currentHandler = null;
			}
		}

		// pages containing ?so=su seem to often not load; remove it and refresh
		function refreshPageIfBad() {
			if (window.location.href.includes("so=su")) {
				window.location.assign(window.location.href.replace("so=su", ""));
			}
		}

		function setPageActions() {
			if (!keyboard && currentHandler) {
				if (currentHandler.hasSearchBar()) {
					actionHandler.addAction(searchAction);
				} else {
					actionHandler.removeAction(searchAction);
				}
				if (handlerHistory.length >= 2) {
					actionHandler.addAction(backAction);
				} else {
					actionHandler.removeAction(backAction);
				}
				actionHandler.onDirection =
					currentHandler.onDirectionAction.bind(currentHandler);
			}
		}

		function showActionHints() {
			if (numGamepads > 0 && (settings.showActionHints ?? true)) {
				actionHandler.showHints();
			} else {
				actionHandler.hideHints();
			}
		}

		function showConnectionHint() {
			if (numGamepads === 0 && (settings.showConnectionHint ?? true)) {
				connectionHintBar.add();
			} else {
				connectionHintBar.remove();
			}
		}

		function updateCompatibility() {
			if (
				(settings.showCompatibilityWarning ?? true) &&
				numGamepads > 0 &&
				!isStandardGamepadConnected()
			) {
				compatibilityWarning.add();
			} else {
				compatibilityWarning.remove();
			}
		}

		function showError(error: Error, timeout: number = -1) {
			console.error("Netflix Controller Error:", error);
			console.error("Error message:", error.message);
			console.error("Error stack:", error.stack);
			console.error("Error name:", error.name);
			errorBar.setError(error.message, timeout);
			errorBar.add();
		}

		function showTempError(error: Error) {
			showError(error, ERROR_ALERT_DURATION);
		}

		function log(message: string) {
			console.log(`NETFLIX-CONTROLLER: ${message}`);
		}

		function warn(message: string) {
			console.warn(`NETFLIX-CONTROLLER: ${message}`);
		}

		function isStandardGamepadConnected() {
			return Object.values(gamepads.gamepads || {}).some(
				(g: GamepadState) => g.mapping === "standard",
			);
		}

		log("Listening for gamepad connections.");
		// Native gamepad events for diagnostics
		window.addEventListener("gamepadconnected", (e: any) => {
			console.log("Native gamepadconnected:", e.gamepad?.id, e);
		});
		window.addEventListener("gamepaddisconnected", (e: any) => {
			console.log("Native gamepaddisconnected:", e.gamepad?.id, e);
		});

		// Some browsers require a user gesture before Gamepad API starts reporting.
		function startOnGestureOnce() {
			try {
				gamepads.start();
				debugDumpGamepads("gesture-start");
			} catch (e) {
				console.warn("Failed to start gamepads on gesture:", e);
			}
		}
		document.addEventListener("pointerdown", startOnGestureOnce, {
			once: true,
		});
		document.addEventListener("keydown", startOnGestureOnce, { once: true });

		// Temporary debug dump of navigator.getGamepads to verify visibility
		function debugDumpGamepads(tag: string) {
			try {
				const gps = (navigator as any).getGamepads?.() || [];
				console.log(`Gamepads[${tag}] count=`, gps.length, gps);
			} catch (e) {
				console.warn("navigator.getGamepads failed:", e);
			}
		}
		setTimeout(() => debugDumpGamepads("t+0.5s"), 500);
		setTimeout(() => debugDumpGamepads("t+2s"), 2000);
		gamepads.addEventListener("connect", (e: any) => {
			if (!hasConnectedGamepad) {
				// first connection, run current page handler manually
				observeProfilePopup();
				runHandler(window.location.pathname);
				hasConnectedGamepad = true;
			}
			connectionHintBar.remove();
			numGamepads++;
			showActionHints();
			updateCompatibility();
			log(`Gamepad connected: ${e.gamepad.gamepad.id}`);
			e.gamepad.addEventListener("buttonpress", (e: any) => {
				try {
					actionHandler.onButtonPress(e.index);
				} catch (error) {
					showTempError(
						error instanceof Error ? error : new Error(String(error)),
					);
				}
			});
			e.gamepad.addEventListener("buttonrelease", (e: unknown) => {
				try {
					actionHandler.onButtonRelease((e as { index: number }).index);
				} catch (error) {
					showTempError(
						error instanceof Error ? error : new Error(String(error)),
					);
				}
			});
			e.gamepad.addEventListener(
				"joystickmove",
				(e: any) => {
					try {
						checkJoystickDirection(
							e.gamepad,
							e.horizontalIndex,
							e.horizontalValue,
							DIRECTION.RIGHT,
							DIRECTION.LEFT,
						);
						checkJoystickDirection(
							e.gamepad,
							e.verticalIndex,
							e.verticalValue,
							DIRECTION.DOWN,
							DIRECTION.UP,
						);
					} catch (error) {
						showTempError(
							error instanceof Error ? error : new Error(String(error)),
						);
					}
				},
				StandardMapping.Axis.JOYSTICK_LEFT,
			);
		});
		gamepads.addEventListener("disconnect", (e: any) => {
			numGamepads--;
			if (numGamepads === 0) {
				actionHandler.hideHints();
			}
			showConnectionHint();
			updateCompatibility();
			log(`Gamepad disconnected: ${e.gamepad.gamepad.id}`);
		});
		gamepads.start();

		// TODO: rethink this messy code; integrate rate limited polling into gamepads.js?
		const timeouts: Record<number, any> = {};
		const directions: Record<number, any> = {};

		function checkJoystickDirection(
			gamepad: any,
			axis: number,
			value: number,
			pos: any,
			neg: any,
		) {
			if (Math.abs(value) >= 1 - gamepad.joystickDeadzone) {
				const direction = value > 0 ? pos : neg;
				if (!(axis in directions) || directions[axis] !== direction) {
					directions[axis] = direction;
					rateLimitJoystickDirection(axis, 500);
				}
			} else {
				directions[axis] = -1;
				if (axis in timeouts) {
					clearTimeout(timeouts[axis]);
					delete timeouts[axis];
				}
			}
		}

		function rateLimitJoystickDirection(axis: number, rateMillis: number) {
			if (directions[axis] !== -1 && actionHandler.onDirection) {
				actionHandler.onDirection(directions[axis]);
				timeouts[axis] = setTimeout(
					() => rateLimitJoystickDirection(axis, rateMillis),
					rateMillis,
				);
			}
		}

		function openSearch() {
			const searchButton = document.querySelector(".searchTab") as HTMLElement;
			if (searchButton) {
				searchButton.click();
			}
			const searchInput = document.querySelector(
				".searchInput > input[type=text]",
			) as HTMLInputElement;
			if (!searchInput) return;
			const searchParent = searchInput.parentElement?.parentElement;
			if (!searchParent) return;
			const startingLocation = window.location.href;
			const handlerState = currentHandler?.exit();
			(Navigatable as any).scrollIntoView(searchInput);

			keyboard = VirtualKeyboardImpl.create(searchInput, searchParent, () => {
				if (keyboard) {
					actionHandler.removeAll(keyboard.getActions());
				}
				if (window.location.href === startingLocation && currentHandler) {
					currentHandler.enter(handlerState as any);
				}
				keyboard = null;
				setPageActions();
			});

			const searchContainer = document.querySelector(
				".secondary-navigation",
			) as HTMLElement;
			if (!searchContainer) return;
			const closeObserver = new MutationObserver(
				(mutations: MutationRecord[]) => {
					for (const mutation of mutations) {
						if (
							!(mutation.target as Element).classList.contains("search-focused")
						) {
							// search bar is no longer focused
							if (keyboard) {
								keyboard.close();
							}
							closeObserver.disconnect();
						}
					}
				},
			);
			closeObserver.observe(searchContainer, {
				attributes: true,
				attributeFilter: ["class"],
			});

			actionHandler.removeAction(searchAction);
			(actionHandler as any).addAll(keyboard.getActions());
			(actionHandler as any).onDirection =
				keyboard.onDirectionAction.bind(keyboard);
		}

		function goBack() {
			if (handlerHistory.length > 0) {
				unload();
				handlerHistory.pop();
				window.history.back();
			}
		}

		// track history to ensure we don't go back to a non-Netflix page
		function addHistory() {
			const location = new URL(window.location.href);
			if (handlerHistory.length > 0) {
				const last = handlerHistory[handlerHistory.length - 1];
				if (last !== location.pathname) {
					handlerHistory.push(location.pathname);
				}
			} else {
				handlerHistory.push(location.pathname);
			}
		}

		function observeProfilePopup() {
			const root = document.getElementById("appMountPoint");
			if (!root) return;
			const observer = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					for (const node of mutation.addedNodes) {
						if (
							node.nodeType === 1 &&
							(node as Element).classList.contains("profiles-gate-container")
						) {
							unload();
							loadPage(ChooseProfile);
						}
					}
				}
			});
			observer.observe(root, { subtree: true, childList: true });
		}

		// Global error handler for uncaught errors
		window.addEventListener("error", (event) => {
			console.error("Global uncaught error:", event.error);
			console.error("Error message:", event.error?.message);
			console.error("Error stack:", event.error?.stack);
			console.error("Error filename:", event.filename);
			console.error("Error lineno:", event.lineno);
			console.error("Error colno:", event.colno);
		});

		window.addEventListener("unhandledrejection", (event) => {
			console.error("Unhandled promise rejection:", event.reason);
			console.error("Promise rejection stack:", event.reason?.stack);
		});

		// Make functions globally available for other modules
		// TODO: Cleaner exportable solution?
		(window as any).runHandler = runHandler;
		(window as any).currentHandler = currentHandler;
		(window as any).actionHandler = actionHandler;
		(window as any).getTransparentNetflixRed = getTransparentNetflixRed;
		(window as any).isKeyboardActive = () => keyboard !== null;
	},
});
