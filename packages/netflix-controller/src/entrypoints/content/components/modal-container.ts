import { GAMEPAD_BUTTONS } from "@ribajs/gamecontroller.js";
import type {
	EnterParams,
	ExitResult,
	NavigationAction,
} from "../../../types/components";
import { DIRECTION } from "./direction.ts";
import { ModalButtonRow } from "./modal-button-row";
import { ModalEpisodeList } from "./modal-episode-list";
import { ModalSimilarTitles } from "./modal-similar-titles";
import { Navigatable } from "./navigatable.ts";

/**
 * Netflix Detail Modal Container Component
 *
 * Manages navigation and interaction within Netflix's detail modal dialogs.
 * These modals appear when clicking on movies/TV shows and contain multiple
 * sections like action buttons, episode lists, and similar titles.
 *
 * Netflix UI Target: The large modal dialog that appears when selecting
 * content, containing:
 * - Action buttons (Play, Add to List, etc.)
 * - Content details and metadata
 * - Episode list (for TV shows)
 * - Similar titles recommendations
 *
 * Features:
 * - Multi-section navigation (buttons → episodes → similar titles)
 * - Dynamic content loading for episodes and similar titles
 * - MutationObserver for DOM changes
 * - Close button integration
 * - State management for active/inactive modal
 */
export class ModalContainer extends Navigatable {
	private modal: HTMLElement | null = null;
	private navigatables: Navigatable[] = [];
	private position: number = -1;
	private closeButton: HTMLElement | null = null;
	private debugMode: boolean = true;

	constructor() {
		super();
		this.findModal();
		this.setupNavigatables();
	}

	/**
	 * Find the modal in the DOM
	 */
	private findModal(): void {
		this.modal = document.querySelector(
			'div[role="dialog"][data-uia="modal-motion-container-DETAIL_MODAL"]',
		) as HTMLElement;

		if (this.modal) {
			// Find close button
			this.closeButton = this.modal.querySelector(
				'.previewModal-close span[role="button"]',
			) as HTMLElement;
		} else {
			this.logDebug("Modal element not found in DOM");
		}
	}

	/**
	 * Set up the navigatable components within the modal
	 */
	private setupNavigatables(): void {
		if (!this.modal) {
			this.logDebug("Cannot setup navigatables - modal not found");
			return;
		}

		// Clear any existing navigatables
		this.navigatables = [];

		// Initialize the button row (play, add to list, like)
		const buttonRow = new ModalButtonRow(this.modal);
		const buttonComponents = buttonRow.getComponents();
		if (buttonComponents && buttonComponents.length > 0) {
			this.navigatables.push(buttonRow);
			this.logDebug(`Added button row with ${buttonComponents.length} buttons`);
		} else {
			this.logDebug("Button row has no components, not adding");
		}

		// Initialize the episode list if it exists (only for series)
		if (this.isSeriesModal()) {
			this.logDebug("Series modal detected, checking for episode list");
			this.waitForEpisodeList();
		}

		// Initialize the similar titles grid
		// Wait a bit for the similar titles to load in the DOM
		this.waitForSimilarTitles();

		this.logDebug(
			`Modal navigatables setup: ${this.navigatables.length} components available initially`,
		);

		// Debug navigatables
		this.navigatables.forEach((nav, index) => {
			this.logDebug(`Navigatable ${index}: ${nav.constructor.name}`);
		});
	}

	/**
	 * Wait for episode list to appear in the DOM and add it when ready
	 */
	private waitForEpisodeList(): void {
		// Check immediately first
		this.checkAndAddEpisodeList();

		// Also set up a short-term observer to catch when they load
		if (!this.modal) return;

		const episodeContainer = this.modal.querySelector(".episodeSelector");
		if (!episodeContainer) {
			this.logDebug("Episode selector container not found");
			return;
		}

		// Create a mutation observer to watch for episodes being added
		const observer = new MutationObserver(() => {
			if (this.checkAndAddEpisodeList()) {
				// Found them, disconnect observer
				observer.disconnect();
			}
		});

		// Start observing
		observer.observe(episodeContainer, {
			childList: true,
			subtree: true,
		});

		// Stop observing after 2 seconds max
		setTimeout(() => {
			observer.disconnect();
		}, 2000);
	}

	/**
	 * Check if episodes are available and add them if not already added
	 * Returns true if episodes were found
	 */
	private checkAndAddEpisodeList(): boolean {
		if (!this.modal) return false;

		// Check if we already have episode list in navigatables
		// Check for 'episodeSelector' property instead of constructor.name (works with minified code)
		const hasEpisodeList = this.navigatables.some(
			(nav) => nav && "episodeSelector" in nav,
		);

		if (hasEpisodeList) {
			return true; // Already added
		}

		// Try to add episode list
		const episodeList = new ModalEpisodeList(this.modal);
		const episodeComponents = episodeList.getComponents();

		if (episodeComponents && episodeComponents.length > 0) {
			// Insert after button row (position 1)
			this.navigatables.splice(1, 0, episodeList);
			this.logDebug(
				`Added episode list with ${episodeComponents.length} episodes`,
			);
			return true;
		}

		return false;
	}

	/**
	 * Wait for similar titles to appear in the DOM and add them when ready
	 */
	private waitForSimilarTitles(): void {
		// Check immediately first
		this.checkAndAddSimilarTitles();

		// Also set up a short-term observer to catch when they load
		if (!this.modal) return;

		const similarContainer = this.modal.querySelector(".moreLikeThis--wrapper");
		if (!similarContainer) {
			this.logDebug("Similar titles container not found");
			return;
		}

		// Create a mutation observer to watch for similar titles being added
		const observer = new MutationObserver(() => {
			if (this.checkAndAddSimilarTitles()) {
				// Found them, disconnect observer
				observer.disconnect();
			}
		});

		// Start observing
		observer.observe(similarContainer, {
			childList: true,
			subtree: true,
		});

		// Stop observing after 2 seconds max
		setTimeout(() => {
			observer.disconnect();
		}, 2000);
	}

	/**
	 * Check if similar titles are available and add them if not already added
	 * Returns true if similar titles were found
	 */
	private checkAndAddSimilarTitles(): boolean {
		if (!this.modal) return false;

		// Check if we already have similar titles in navigatables
		// Check for 'similarTitlesContainer' property instead of constructor.name (works with minified code)
		const hasSimilarTitles = this.navigatables.some(
			(nav) => nav && "similarTitlesContainer" in nav,
		);

		if (hasSimilarTitles) {
			return true; // Already added
		}

		// Try to add similar titles
		const similarTitles = new ModalSimilarTitles(this.modal);
		const similarComponents = similarTitles.getComponents();

		if (similarComponents && similarComponents.length > 0) {
			this.navigatables.push(similarTitles);
			this.logDebug(
				`Added similar titles with ${similarComponents.length} items`,
			);
			return true;
		}

		return false;
	}

	/**
	 * Check if this modal is for a series (has episodes)
	 */
	private isSeriesModal(): boolean {
		const hasEpisodeSelector = !!this.modal?.querySelector(".episodeSelector");
		this.logDebug(`Is series modal: ${hasEpisodeSelector}`);
		return hasEpisodeSelector;
	}

	/**
	 * Select the navigatable at the given position
	 */
	private select(position: number): void {
		this.logDebug(`Selecting navigatable at position ${position}`);

		if (position < 0 || position >= this.navigatables.length) {
			this.logDebug(
				`Invalid position ${position}, max is ${this.navigatables.length - 1}`,
			);
			return;
		}

		// First exit current navigatable
		if (this.position >= 0 && this.position < this.navigatables.length) {
			this.logDebug(`Exiting current navigatable at position ${this.position}`);
			this.navigatables[this.position].exit();
		}

		// Update position and enter new navigatable
		this.position = position;
		this.logDebug(`Entering new navigatable at position ${this.position}`);
		this.navigatables[this.position].enter();
	}

	/**
	 * Move navigation up to previous navigatable
	 */
	up(): void {
		this.logDebug(`Up pressed, current position: ${this.position}`);

		// Check if current navigatable can handle this internally
		if (this.position >= 0 && this.position < this.navigatables.length) {
			const navigatable = this.navigatables[this.position];

			// First try handleInternalUp if it exists (for components like ModalEpisodeList)
			const withInternalHandler = navigatable as unknown as {
				handleInternalUp?: () => boolean;
			};
			if (withInternalHandler.handleInternalUp?.()) {
				this.logDebug("Up handled internally via handleInternalUp");
				return;
			}

			// For other components, check if they can navigate up internally
			// by checking their current position
			const withPosition = navigatable as unknown as {
				position?: number;
			};
			const currentInternalPosition = withPosition.position ?? -1;

			// Call up() on the component
			navigatable.up();

			// Check if the internal position changed
			const newInternalPosition = withPosition.position ?? -1;
			if (newInternalPosition !== currentInternalPosition) {
				this.logDebug(
					`Up handled internally (position changed from ${currentInternalPosition} to ${newInternalPosition})`,
				);
				return;
			}

			// Position didn't change, component cannot handle up - fall through to navigate to previous component
			this.logDebug("Component at edge, moving to previous navigatable");
		}

		// Move to previous navigatable if possible
		if (this.position > 0) {
			this.logDebug(
				`Moving to previous navigatable at position ${this.position - 1}`,
			);
			this.select(this.position - 1);
		} else {
			this.logDebug("Already at first navigatable, cannot move up");
		}
	}

	/**
	 * Move navigation down to next navigatable
	 */
	down(): void {
		this.logDebug(`Down pressed, current position: ${this.position}`);

		// Check if current navigatable can handle this internally
		if (this.position >= 0 && this.position < this.navigatables.length) {
			const navigatable = this.navigatables[this.position];

			// First try handleInternalDown if it exists (for components like ModalEpisodeList)
			const withInternalHandler = navigatable as unknown as {
				handleInternalDown?: () => boolean;
			};
			if (withInternalHandler.handleInternalDown?.()) {
				this.logDebug("Down handled internally via handleInternalDown");
				return;
			}

			// For other components, check if they can navigate down internally
			// by checking their current position
			const withPosition = navigatable as unknown as {
				position?: number;
			};
			const currentInternalPosition = withPosition.position ?? -1;

			// Call down() on the component
			navigatable.down();

			// Check if the internal position changed
			const newInternalPosition = withPosition.position ?? -1;
			if (newInternalPosition !== currentInternalPosition) {
				this.logDebug(
					`Down handled internally (position changed from ${currentInternalPosition} to ${newInternalPosition})`,
				);
				return;
			}

			// Position didn't change, component cannot handle down - fall through to navigate to next component
			this.logDebug("Component at edge, moving to next navigatable");
		}

		// Move to next navigatable if possible
		if (this.position < this.navigatables.length - 1) {
			this.logDebug(
				`Moving to next navigatable at position ${this.position + 1}`,
			);
			this.select(this.position + 1);
		} else {
			this.logDebug("Already at last navigatable, cannot move down");
		}
	}

	/**
	 * Pass left navigation to current navigatable
	 */
	left(): void {
		this.logDebug(`Left pressed, current position: ${this.position}`);

		if (this.position < this.navigatables.length) {
			this.navigatables[this.position].left();
		}
	}

	/**
	 * Pass right navigation to current navigatable
	 */
	right(): void {
		this.logDebug(`Right pressed, current position: ${this.position}`);

		if (this.position < this.navigatables.length) {
			this.navigatables[this.position].right();
		}
	}

	/**
	 * Handle direction input (dispatches to up/down/left/right methods)
	 */
	onDirectionAction(direction: number): void {
		if (direction === DIRECTION.UP) {
			this.up();
		} else if (direction === DIRECTION.DOWN) {
			this.down();
		} else if (direction === DIRECTION.LEFT) {
			this.left();
		} else if (direction === DIRECTION.RIGHT) {
			this.right();
		}
	}

	/**
	 * Initialize the modal container
	 */
	enter(_params?: EnterParams): void {
		this.logDebug("Entering modal container");

		// Refresh navigatables to ensure we have the latest DOM state
		this.setupNavigatables();

		// Select the first navigatable
		if (this.navigatables.length > 0) {
			this.select(0);
		} else {
			this.logDebug("No navigatables available to select");
		}
	}

	/**
	 * Cleanup when exiting the modal container
	 */
	exit(): ExitResult {
		this.logDebug("Exiting modal container");

		// Exit current navigatable
		if (this.position >= 0 && this.position < this.navigatables.length) {
			this.navigatables[this.position].exit();
		}

		// Reset state
		this.position = -1;
		return {};
	}

	/**
	 * Define available actions for the modal
	 */
	getActions(): NavigationAction[] {
		return [
			{
				label: "Select",
				index: GAMEPAD_BUTTONS.BUTTON_BOTTOM,
				onPress: () => this.interact(),
			},
			{
				label: "Close",
				index: GAMEPAD_BUTTONS.BUTTON_RIGHT,
				onPress: () => this.close(),
			},
		];
	}

	/**
	 * Clean up resources when this component is no longer needed
	 */
	cleanup(): void {
		this.logDebug("Cleaning up modal container resources");

		// Clean up each navigatable
		this.navigatables.forEach((navigatable) => {
			if (navigatable.cleanup) {
				navigatable.cleanup();
			}
		});

		// Clear references
		this.navigatables = [];
		this.modal = null;
		this.closeButton = null;
		this.position = -1;
	}

	/**
	 * Interact with the current navigatable
	 */
	private interact(): void {
		this.logDebug(`Interact pressed, current position: ${this.position}`);

		if (this.position >= 0 && this.position < this.navigatables.length) {
			const navigatable = this.navigatables[this.position] as unknown as {
				interact?: (component: unknown) => void;
			};
			if (typeof navigatable.interact === "function") {
				this.logDebug("Calling interact on current navigatable");
				navigatable.interact(null);
			} else {
				this.logDebug("Current navigatable does not have interact method");
			}
		} else {
			this.logDebug("No valid navigatable selected for interaction");
		}
	}

	/**
	 * Close the modal
	 */
	private close(): void {
		this.logDebug("Close modal requested");

		if (this.closeButton) {
			this.logDebug("Clicking close button");
			this.closeButton.click();
		} else {
			this.logDebug("No close button found");
		}
	}

	/**
	 * Log debug messages if debug mode is enabled
	 */
	private logDebug(message: string): void {
		if (this.debugMode) {
			console.log(`[ModalContainer] ${message}`);
		}
	}
}
