import { SearchGallery } from "../components/search-gallery.ts";
import { NavigatablePage } from "./page.ts";

/**
 * Column breaks:
 * * 0 - 599 px: 2 columns
 * * 600 - 959 px: 3 columns
 * * 960 - 1279 px: 4 columns
 * * 1280 - 1919 px: 5 columns
 * * 1920 - Infinity px: 6 columns
 */
export class SearchBrowse extends NavigatablePage {
	loaded: boolean;
	observer!: MutationObserver | null;
	keyboardObserver: MutationObserver | null = null;
	lastKeyboardState: boolean = false;
	_keyboardCheckIntervalId: number | null = null;

	constructor() {
		super();
		this.loaded = false;
		this.observeSearchResults();
	}

	static validatePath(path: string): boolean {
		return path.startsWith("/search");
	}

	onLoad(): void {
		this.addNavigatable(0, new SearchGallery());
		this.setNavigatable(0);
		if (this.observer) {
			this.observer.disconnect();
		}

		// Monitor keyboard state changes
		this.setupKeyboardStateObserver();
	}

	isPageReady(): boolean {
		// Wait for search results to load AND virtual keyboard to be closed
		if (window.isKeyboardActive?.()) {
			return false;
		}
		return this.loaded;
	}

	needsPseudoStyler(): boolean {
		return true;
	}

	hasSearchBar(): boolean {
		return true;
	}

	setNavigatable(position: number): void {
		if (position === 0) {
			super.setNavigatable(position);
		}
	}

	// Override onUnload to clean up resources
	onUnload(): void {
		super.onUnload();

		// Clean up keyboard observer
		if (this.keyboardObserver) {
			this.keyboardObserver.disconnect();
			this.keyboardObserver = null;
		}

		// Clear keyboard check interval
		if (this._keyboardCheckIntervalId !== null) {
			window.clearInterval(this._keyboardCheckIntervalId);
			this._keyboardCheckIntervalId = null;
		}
	}

	// Monitor keyboard state changes
	setupKeyboardStateObserver(): void {
		// Check if window.isKeyboardActive exists
		if (typeof window.isKeyboardActive !== "function") {
			return;
		}

		// Get the initial keyboard state
		this.lastKeyboardState = Boolean(window.isKeyboardActive());

		// Setup an interval to check keyboard state changes
		const intervalId = window.setInterval(() => {
			// Check if the function still exists
			if (typeof window.isKeyboardActive !== "function") {
				return;
			}

			const currentKeyboardState = Boolean(window.isKeyboardActive());

			// If keyboard state changed from active to inactive
			if (this.lastKeyboardState && !currentKeyboardState) {
				// Keyboard was closed, refresh the components
				if (this.navigatables[0]) {
					const searchGallery = this.navigatables[0] as SearchGallery;
					if (
						searchGallery &&
						typeof searchGallery.refreshComponents === "function"
					) {
						searchGallery.refreshComponents();
					}
				}
			}

			// Update last known state
			this.lastKeyboardState = currentKeyboardState;
		}, 200);

		// Store the interval ID for cleanup
		this._keyboardCheckIntervalId = intervalId;
	}

	// wait until search results are updated to load the page
	observeSearchResults(): void {
		const search = document.querySelector(".search");
		if (!search) {
			// Search element not found, mark as loaded immediately
			this.loaded = true;
			// Initialize observer to null to indicate no observation is needed
			this.observer = null;
			return;
		}
		const callback = (mutationsList: MutationRecord[]) => {
			for (const mutation of mutationsList) {
				if (mutation.type === "childList") {
					this.loaded = true;
				}
			}
		};
		this.observer = new MutationObserver(callback);
		this.observer.observe(search, { childList: true, subtree: true });
	}
}
