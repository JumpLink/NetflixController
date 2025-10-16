import gameControl, {
	GAMEPAD_BUTTONS,
	type GamepadState,
} from "@ribajs/gamecontroller.js";
import type { ExitResult, NavigationAction } from "../../types/components";
import type { ContentScriptMessage } from "../../types/messages";
import type { Settings } from "../../types/settings";
import { gamepadMappings } from "../../utils/gamepad-icons.ts";
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
		const pageHandlers: (
			| typeof ChooseProfile
			| typeof FeaturedBrowse
			| typeof FeaturelessBrowse
			| typeof LatestBrowse
			| typeof TitleBrowse
			| typeof SearchBrowse
			| typeof WatchVideo
		)[] = [
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
			index: GAMEPAD_BUTTONS.BUTTON_TOP,
			onPress: openSearch,
		};

		const backAction: NavigationAction = {
			label: "Back",
			index: GAMEPAD_BUTTONS.BUTTON_RIGHT,
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
					// gameControl doesn't have a stop method, it's always running
					// We can handle this differently if needed
				} else if (request.message === "enableGamepadInput") {
					// gameControl is always running, no need to start
				}
			},
		);

		async function runHandler(path: string, forceLoad: boolean = false) {
			if (forceLoad || path !== currentPath) {
				unload();
				refreshPageIfBad();
				let found = false;
				for (let i = 0; !found && i < pageHandlers.length; i++) {
					if (
						(
							pageHandlers[i] as { validatePath: (path: string) => boolean }
						).validatePath(path)
					) {
						log(
							`Loading ${(pageHandlers[i] as { name: string }).name} module for ${path}`,
						);
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

		async function loadPage(
			handlerClass:
				| typeof ChooseProfile
				| typeof FeaturedBrowse
				| typeof FeaturelessBrowse
				| typeof LatestBrowse
				| typeof TitleBrowse
				| typeof SearchBrowse
				| typeof WatchVideo,
		) {
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
			return Object.values(gameControl.gamepads || {}).some(
				(g: GamepadState) => g.mapping === "standard",
			);
		}

		log("Listening for gamepad connections.");

		// Native gamepad events for diagnostics
		window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
			console.log("Native gamepadconnected:", e.gamepad?.id, e);
		});
		window.addEventListener("gamepaddisconnected", (e: GamepadEvent) => {
			console.log("Native gamepaddisconnected:", e.gamepad?.id, e);
		});

		// Temporary debug dump of navigator.getGamepads to verify visibility
		function debugDumpGamepads(tag: string) {
			try {
				const gps =
					(navigator as { getGamepads?: () => Gamepad[] }).getGamepads?.() ||
					[];
				console.log(`Gamepads[${tag}] count=`, gps.length, gps);
			} catch (e) {
				console.warn("navigator.getGamepads failed:", e);
			}
		}
		setTimeout(() => debugDumpGamepads("t+0.5s"), 500);
		setTimeout(() => debugDumpGamepads("t+2s"), 2000);

		// Setup button event handlers for a gamepad
		function setupButtonHandlers(gamepad: GamepadState) {
			// Setup handlers for all possible buttons (0-16)
			for (let i = 0; i <= 16; i++) {
				const buttonIndex = i;
				gamepad.before(`button${buttonIndex}`, () => {
					try {
						actionHandler.onButtonPress(buttonIndex);
					} catch (error) {
						showTempError(
							error instanceof Error ? error : new Error(String(error)),
						);
					}
				});
				gamepad.after(`button${buttonIndex}`, () => {
					try {
						actionHandler.onButtonRelease(buttonIndex);
					} catch (error) {
						showTempError(
							error instanceof Error ? error : new Error(String(error)),
						);
					}
				});
			}
		}

		// Setup joystick event handlers for a gamepad
		function setupJoystickHandlers(gamepad: GamepadState) {
			// Left joystick directional events - use .before() to fire only once per direction
			gamepad.before("up0", () => {
				try {
					if (actionHandler.onDirection) {
						actionHandler.onDirection(DIRECTION.UP);
					}
				} catch (error) {
					showTempError(
						error instanceof Error ? error : new Error(String(error)),
					);
				}
			});
			gamepad.before("down0", () => {
				try {
					if (actionHandler.onDirection) {
						actionHandler.onDirection(DIRECTION.DOWN);
					}
				} catch (error) {
					showTempError(
						error instanceof Error ? error : new Error(String(error)),
					);
				}
			});
			gamepad.before("left0", () => {
				try {
					if (actionHandler.onDirection) {
						actionHandler.onDirection(DIRECTION.LEFT);
					}
				} catch (error) {
					showTempError(
						error instanceof Error ? error : new Error(String(error)),
					);
				}
			});
			gamepad.before("right0", () => {
				try {
					if (actionHandler.onDirection) {
						actionHandler.onDirection(DIRECTION.RIGHT);
					}
				} catch (error) {
					showTempError(
						error instanceof Error ? error : new Error(String(error)),
					);
				}
			});
		}

		gameControl.on("connect", (gamepad: GamepadState) => {
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
			log(`Gamepad connected: ${gamepad.id || "Unknown"}`);

			// Setup all event handlers for this gamepad
			setupButtonHandlers(gamepad);
			setupJoystickHandlers(gamepad);
		});

		gameControl.on("disconnect", (index: number) => {
			numGamepads--;
			if (numGamepads === 0) {
				actionHandler.hideHints();
			}
			showConnectionHint();
			updateCompatibility();
			log(`Gamepad disconnected: ${index}`);
		});

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
			(
				Navigatable as { scrollIntoView: (element: HTMLElement) => void }
			).scrollIntoView(searchInput);

			keyboard = VirtualKeyboardImpl.create(searchInput, searchParent, () => {
				if (keyboard) {
					actionHandler.removeAll(keyboard.getActions());
				}
				if (window.location.href === startingLocation && currentHandler) {
					currentHandler.enter(handlerState as ExitResult);
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
			(
				actionHandler as { addAll: (actions: NavigationAction[]) => void }
			).addAll(keyboard.getActions());
			(
				actionHandler as { onDirection: ((direction: number) => void) | null }
			).onDirection = keyboard.onDirectionAction.bind(keyboard);
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
		(window as unknown as Record<string, unknown>).runHandler = runHandler;
		(window as unknown as Record<string, unknown>).currentHandler =
			currentHandler;
		(window as unknown as Record<string, unknown>).actionHandler =
			actionHandler;
		(window as unknown as Record<string, unknown>).getTransparentNetflixRed =
			getTransparentNetflixRed;
		(window as unknown as Record<string, unknown>).isKeyboardActive = () =>
			keyboard !== null;
	},
});
