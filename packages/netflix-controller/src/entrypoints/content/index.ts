import gameControl, {
	GAMEPAD_BUTTONS,
	type GamepadState,
} from "@ribajs/gamecontroller.js";
// injectScript is available globally in content scripts
import type { ExitResult, NavigationAction } from "../../types/components";
import type { ContentScriptMessage } from "../../types/messages";
import type { Settings } from "../../types/settings";
import { getControllerMapping } from "../../utils/controller-detection";
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
// Modal detection
import { ModalDetector } from "./services/modal-detector.ts";
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
		let gamepadInputEnabled = true; // Controls whether gamepad input is processed
		const handlerHistory: string[] = [];
		let currentHandler: NavigatablePage | null = null;
		const settings: Settings = {
			showActionHints: true,
			buttonImageMapping: "Xbox Series",
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
				settings.buttonImageMapping = v ?? "Xbox Series";
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

		// Initialize modal detector
		const modalDetector = ModalDetector.getInstance();

		// Register callback for modal state changes
		modalDetector.onModalStateChange((isOpen, modalId) => {
			log(`Modal state changed: ${isOpen ? "open" : "closed"}, ID: ${modalId}`);

			if (isOpen) {
				// Modal opened
				handleModalOpen();
			} else {
				// Modal closed
				handleModalClose();
			}
		});

		/**
		 * Handle modal open event
		 */
		function handleModalOpen() {
			if (!currentHandler) {
				console.log("No current handler when modal opened");
				return;
			}

			console.log("Modal opened - saving page state");

			try {
				// Save current page state for later restoration
				const currentPath = window.location.pathname;
				const currentPosition = currentHandler.position;
				const currentNavigatableType =
					currentHandler.navigatables[currentPosition]?.constructor.name ||
					"unknown";

				// Store page state in the modal detector
				modalDetector.savePageState(
					currentPath,
					currentPosition,
					currentNavigatableType,
				);

				// Verify modal container is available
				const modalContainer = modalDetector.getModalContainer();
				if (!modalContainer) {
					console.log("No modal container available");
					return;
				}

				// Initialize modal navigation
				// The modal will start at position 0 by default
				console.log("Modal container ready for navigation");

				// Update actions for modal navigation
				actionHandler.removeAction(searchAction);
			} catch (error) {
				console.error("Error during modal open:", error);
			}
		}

		/**
		 * Handle modal close event
		 */
		function handleModalClose() {
			if (!currentHandler) {
				console.log("No current handler when modal closed");
				return;
			}

			console.log("Modal closed - restoring page navigation");

			try {
				// Get the saved page state
				const savedState = modalDetector.getSavedPageState();

				// Determine if we need to reload the page handler
				const currentPath = window.location.pathname;
				const needsReload = savedState && savedState.path !== currentPath;

				if (needsReload) {
					console.log(
						`Path changed from ${savedState?.path} to ${currentPath}, reloading handler`,
					);
					// Path changed, reload the page handler
					runHandler(currentPath, true);
				} else {
					// Path is the same, restore navigation position
					restorePageNavigation(savedState);
				}

				// Clear the saved state
				modalDetector.clearSavedPageState();
			} catch (error) {
				console.error("Error during modal close:", error);

				// Emergency recovery - try to reload the current page handler
				try {
					runHandler(window.location.pathname, true);
				} catch (innerError) {
					console.error("Failed emergency recovery:", innerError);
				}
			}

			// Restore page actions
			setPageActions();
		}

		/**
		 * Restore page navigation based on saved state
		 */
		function restorePageNavigation(
			savedState: {
				path: string;
				position: number;
				navigatableType: string;
			} | null,
		) {
			if (!currentHandler) return;

			try {
				console.log("Restoring page navigation");

				// First, determine what type of page we're on
				const path = window.location.pathname;
				console.log(`Current path: ${path}`);

				if (path.includes("/search")) {
					console.log("Restoring search page navigation");
					restoreSearchPageNavigation();
				} else if (path.includes("/browse")) {
					console.log("Restoring browse page navigation");
					restoreBrowsePageNavigation(savedState);
				} else {
					console.log("Restoring generic page navigation");
					restoreGenericPageNavigation(savedState);
				}
			} catch (error) {
				console.error("Error restoring page navigation:", error);
			}
		}

		/**
		 * Restore search page navigation
		 */
		function restoreSearchPageNavigation() {
			if (!currentHandler || !currentHandler.navigatables.length) return;

			// Find the search gallery component
			// Check for 'columnCount' property instead of constructor.name (works with minified code)
			let searchGalleryIndex = -1;
			for (let i = 0; i < currentHandler.navigatables.length; i++) {
				const nav = currentHandler.navigatables[i];
				// SearchGallery has a columnCount property
				if (
					nav &&
					"columnCount" in nav &&
					typeof (nav as Record<string, unknown>).columnCount === "number"
				) {
					searchGalleryIndex = i;
					break;
				}
			}

			if (searchGalleryIndex >= 0) {
				console.log(`Found SearchGallery at position ${searchGalleryIndex}`);
				// Use a small delay to ensure DOM is ready
				setTimeout(() => {
					if (currentHandler) {
						currentHandler.setNavigatable(searchGalleryIndex);
					}
				}, 100);
			} else {
				// Fallback to first navigatable
				console.log("SearchGallery not found, using first navigatable");
				setTimeout(() => {
					if (currentHandler) {
						currentHandler.setNavigatable(0);
					}
				}, 100);
			}
		}

		/**
		 * Restore browse page navigation
		 */
		function restoreBrowsePageNavigation(
			savedState: {
				path: string;
				position: number;
				navigatableType: string;
			} | null,
		) {
			if (!currentHandler || !currentHandler.navigatables.length) return;

			// Try to restore to the saved position
			if (savedState && savedState.position >= 0) {
				// Make sure the position is valid
				const targetPosition = Math.min(
					savedState.position,
					currentHandler.navigatables.length - 1,
				);

				console.log(
					`Restoring browse page to position ${targetPosition} (saved: ${savedState.position})`,
				);

				// Use a small delay to ensure DOM is ready
				setTimeout(() => {
					if (currentHandler) {
						currentHandler.setNavigatable(targetPosition);
					}
				}, 100);
			} else {
				// Default: Try to find a slider or billboard
				let targetPosition = 1; // Default to position 1 (usually billboard/menu)

				// Look for the first Slider or Billboard component
				// Check for 'row' property instead of constructor.name (works with minified code)
				for (let i = 0; i < currentHandler.navigatables.length; i++) {
					const nav = currentHandler.navigatables[i];
					if (nav && "row" in nav && typeof nav.row === "number") {
						targetPosition = i;
						break;
					}
				}

				console.log(`No saved position, setting to position ${targetPosition}`);
				setTimeout(() => {
					if (currentHandler) {
						currentHandler.setNavigatable(targetPosition);
					}
				}, 100);
			}
		}

		/**
		 * Restore generic page navigation
		 */
		function restoreGenericPageNavigation(
			savedState: {
				path: string;
				position: number;
				navigatableType: string;
			} | null,
		) {
			if (!currentHandler || !currentHandler.navigatables.length) return;

			// Use saved position if available and valid
			if (
				savedState &&
				savedState.position >= 0 &&
				savedState.position < currentHandler.navigatables.length
			) {
				console.log(`Restoring to saved position ${savedState.position}`);
				currentHandler.setNavigatable(savedState.position);
			} else {
				// Fallback to a safe position
				const safePosition = Math.min(
					1,
					currentHandler.navigatables.length - 1,
				);
				console.log(
					`No valid saved position, using safe position ${safePosition}`,
				);
				currentHandler.setNavigatable(Math.max(0, safePosition));
			}
		}

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
					// Disable input processing while popup is open (events still fire, but are ignored)
					gamepadInputEnabled = false;
					log("Gamepad input disabled (popup open)");
				} else if (request.message === "enableGamepadInput") {
					// Re-enable input processing when popup closes
					gamepadInputEnabled = true;
					log("Gamepad input enabled (popup closed)");
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
			try {
				if (currentHandler) {
					await currentHandler.load();

					// Set page actions AFTER loading is complete
					setPageActions();

					// Check if modal is already open
					if (modalDetector.isOpen()) {
						handleModalOpen();
					}
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
			console.log(
				"[setPageActions] Called, keyboard:",
				!!keyboard,
				"currentHandler:",
				currentHandler?.constructor.name,
			);
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
				console.log(
					"[setPageActions] Setting up direction handler with modal interception",
				);

				// Intercept direction events at the highest level
				// If modal is open, route to modal; otherwise route to page handler
				actionHandler.onDirection = (direction: number) => {
					const modalContainer = modalDetector.getModalContainer();
					const isModalOpen = modalDetector.isOpen();

					if (isModalOpen && modalContainer) {
						// Route directly to modal
						console.log("[setPageActions] Routing direction to modal");
						modalContainer.onDirectionAction(direction);
					} else {
						// Route to page handler
						console.log("[setPageActions] Routing direction to page handler");
						currentHandler?.onDirectionAction(direction);
					}
				};
			} else {
				console.log(
					"[setPageActions] Skipped - keyboard active or no currentHandler",
				);
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

		// Inject the main world Netflix API script for watch pages
		injectScript("/netflix-main-world.js", {
			keepInDom: true,
		}).catch((error: unknown) => {
			console.warn(
				"[NETFLIX-CONTROLLER] Failed to inject main world script:",
				error,
			);
		});

		// Native gamepad events for diagnostics
		window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
			console.log("Native gamepadconnected:", e.gamepad?.id, e);
		});
		window.addEventListener("gamepaddisconnected", (e: GamepadEvent) => {
			console.log("Native gamepaddisconnected:", e.gamepad?.id, e);
		});

		// Setup button event handlers for a gamepad
		function setupButtonHandlers(gamepad: GamepadState) {
			// Setup handlers for all possible buttons (0-16)
			for (let i = 0; i <= 16; i++) {
				const buttonIndex = i;
				gamepad.before(`button${buttonIndex}`, () => {
					if (!gamepadInputEnabled) return; // Ignore input when disabled (e.g., popup open)
					try {
						actionHandler.onButtonPress(buttonIndex);
					} catch (error) {
						showTempError(
							error instanceof Error ? error : new Error(String(error)),
						);
					}
				});
				gamepad.after(`button${buttonIndex}`, () => {
					if (!gamepadInputEnabled) return; // Ignore input when disabled (e.g., popup open)
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
			// Using aliases "up", "down", "left", "right" (equivalent to "up0", "down0", "left0", "right0")
			gamepad.before("up", () => {
				if (!gamepadInputEnabled) return; // Ignore input when disabled (e.g., popup open)
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
			gamepad.before("down", () => {
				if (!gamepadInputEnabled) return; // Ignore input when disabled (e.g., popup open)
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
			gamepad.before("left", () => {
				if (!gamepadInputEnabled) return; // Ignore input when disabled (e.g., popup open)
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
			gamepad.before("right", () => {
				if (!gamepadInputEnabled) return; // Ignore input when disabled (e.g., popup open)
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

			// Auto-detect controller type and temporarily override user preference
			const detectedMapping = getControllerMapping(
				gamepad.controllerId,
				settings.buttonImageMapping,
			);
			if (detectedMapping !== settings.buttonImageMapping) {
				log(
					`Gamepad connected: ${gamepad.controllerId || "Unknown"} - Auto-detected as ${detectedMapping}`,
				);
				settings.buttonImageMapping = detectedMapping;
				actionHandler.updateHints();
			} else {
				log(`Gamepad connected: ${gamepad.controllerId || "Unknown"}`);
			}

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
			// If a modal is open, close it by simulating back button
			if (modalDetector.isOpen()) {
				const modalContainer = modalDetector.getModalContainer();
				if (modalContainer) {
					// Use the close method from the modal container
					modalContainer.exit();

					// Simulate clicking the close button
					const closeButton = document.querySelector(
						'.previewModal-close span[role="button"]',
					) as HTMLElement;

					if (closeButton) {
						closeButton.click();
					}
					return;
				}
			}

			// Normal back navigation
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
