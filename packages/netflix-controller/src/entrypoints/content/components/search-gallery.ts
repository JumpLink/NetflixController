import type {
	InteractiveComponent,
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components.ts";
import type { PseudoStyler } from "../../../utils/pseudostyler.ts";
import { StaticNavigatable } from "./static-navigatable.ts";

/**
 * Netflix Search Results Grid Component
 *
 * Handles the grid-based layout of search results on Netflix search pages.
 * Displays search results in a responsive grid that adapts to screen size
 * and supports infinite scrolling as users navigate through results.
 *
 * Netflix UI Target: The grid layout of search results that appears when
 * searching for movies/TV shows. Results are displayed in rows and columns
 * with poster images and can be scrolled both horizontally and vertically.
 *
 * Features:
 * - Responsive grid layout (adapts to screen width)
 * - Infinite scroll support for large result sets
 * - 2D navigation (up/down between rows, left/right within rows)
 * - Dynamic column count calculation
 * - MutationObserver for dynamic content loading
 * - Debounced scroll/resize handlers for performance
 */
export class SearchGallery extends StaticNavigatable {
	private columnCount: number;
	private resizeHandler: () => void;
	private scrollHandler: () => void;
	private resultsObserver: MutationObserver | null = null;

	constructor() {
		super();
		this.columnCount = this.calculateColumnCount();

		// Create a debounced resize handler
		this.resizeHandler = this.debounce(() => {
			this.columnCount = this.calculateColumnCount();
		}, 250);

		// Create a debounced scroll handler for infinity scroll
		this.scrollHandler = this.debounce(() => {
			this.refreshComponents();
		}, 350);

		// Add resize event listener
		window.addEventListener("resize", this.resizeHandler);

		// Add scroll event listener for infinity scroll
		window.addEventListener("scroll", this.scrollHandler);

		// Observe search results for changes
		this.observeSearchResults();
	}

	getComponents(): NavigatableComponent[] {
		return Array.from(
			document.querySelectorAll(
				'section[data-uia="search-gallery"] a[data-uia="search-gallery-video-card"]',
			),
		);
	}

	/**
	 * Clean up event listeners when this component is no longer needed
	 */
	cleanup(): void {
		window.removeEventListener("resize", this.resizeHandler);
		window.removeEventListener("scroll", this.scrollHandler);

		if (this.resultsObserver) {
			this.resultsObserver.disconnect();
			this.resultsObserver = null;
		}
	}

	/**
	 * Simple debounce function
	 */
	private debounce(func: () => void, wait: number): () => void {
		let timeout: number | null = null;
		return () => {
			if (timeout !== null) {
				window.clearTimeout(timeout);
			}
			timeout = window.setTimeout(func, wait);
		};
	}

	style(
		component: StyleableComponent | undefined | null,
		selected: boolean,
	): void {
		if (!component) {
			return; // Don't attempt to style undefined or null components
		}

		// Make sure we have a valid styler
		if (!this.styler) {
			return;
		}

		// Safely apply the style with type assertion
		(this.styler as PseudoStyler).toggleStyle(component, ":focus", selected);
	}

	interact(component: InteractiveComponent | null): void {
		if (!component) {
			return;
		}

		// Check if the component is still in the DOM
		if (!component.isConnected) {
			console.warn("Attempted to interact with a detached component");
			// Try to refresh components if the selected one is no longer valid
			this.refreshComponents();
			return;
		}

		component.click();
	}

	/**
	 * Get the number of columns based on window width
	 * @returns The number of columns in the current view
	 */
	getColumnCount(): number {
		return this.columnCount;
	}

	/**
	 * Calculate the number of columns based on window width
	 * @returns The number of columns in the current view
	 */
	private calculateColumnCount(): number {
		const width = window.innerWidth;

		if (width < 600) return 2;
		if (width < 960) return 3;
		if (width < 1280) return 4;
		if (width < 1920) return 5;
		return 6;
	}

	/**
	 * Calculate the current row and column of a position in the grid
	 * @param position The position to calculate row and column for
	 * @returns An object with row and column properties
	 */
	getRowAndColumn(position: number): { row: number; column: number } {
		const columns = this.getColumnCount();
		return {
			row: Math.floor(position / columns),
			column: position % columns,
		};
	}

	/**
	 * Calculate position from row and column
	 * @param row Row index
	 * @param column Column index
	 * @returns The position in the flat array
	 */
	getPositionFromRowAndColumn(row: number, column: number): number {
		return row * this.getColumnCount() + column;
	}

	/**
	 * Override up navigation to move to the item in the same column but previous row
	 */
	up(): void {
		// First check if we have a valid position and components
		if (this.position < 0 || this.components.length === 0) {
			// If we're in an invalid state, try to reset by selecting the first component if available
			if (this.components.length > 0) {
				this.select(0);
			}
			return;
		}

		const { row, column } = this.getRowAndColumn(this.position);

		if (row > 0) {
			const prevPosition = this.getPositionFromRowAndColumn(row - 1, column);

			// Check if the component at this position is valid
			if (
				prevPosition >= 0 &&
				prevPosition < this.components.length &&
				this.components[prevPosition]
			) {
				// Move to the previous row in the same column
				this.select(prevPosition);
			} else {
				// Component at previous position is invalid, refresh components and try again
				this.refreshComponents();
			}
		}
		// If at the top row, do nothing
	}

	/**
	 * Override down navigation to move to the item in the same column but next row
	 */
	down(): void {
		// First check if we have a valid position and components
		if (this.position < 0 || this.components.length === 0) {
			// If we're in an invalid state, try to reset by selecting the first component if available
			if (this.components.length > 0) {
				this.select(0);
			}
			return;
		}

		const { row, column } = this.getRowAndColumn(this.position);
		const nextRow = row + 1;
		const nextPosition = this.getPositionFromRowAndColumn(nextRow, column);

		// Check if next position exists and doesn't exceed the total number of items
		if (nextPosition < this.components.length) {
			// Also check if the component at this position is valid
			if (this.components[nextPosition]) {
				this.select(nextPosition);
			} else {
				// Component at next position is invalid, refresh components and try again
				this.refreshComponents();
			}
		}
		// If at the bottom row, do nothing
	}

	/**
	 * Refreshes the components list and maintains current selection if possible
	 */
	refreshComponents(): void {
		// Store the current position for later
		const currentPosition = this.position;
		const currentSelectedComponent =
			currentPosition >= 0 && this.components.length > currentPosition
				? this.components[currentPosition]
				: null;

		// Safely unselect current component to avoid style issues
		try {
			if (currentPosition >= 0) {
				this.unselect();
			}
		} catch (_error) {
			// If unselect fails, the component might be detached - just reset position
			this.position = -1;
		}

		// Clear cached components to force a refresh
		this._components = null;

		// Get the refreshed components
		const newComponents = this.getComponents();

		// If we have no components, nothing more to do
		if (newComponents.length === 0) {
			this.position = -1;
			return;
		}

		// Try to maintain selection
		if (currentSelectedComponent) {
			// Find the same component in the new components list
			const newPosition = newComponents.indexOf(currentSelectedComponent);

			if (newPosition >= 0) {
				// Component still exists, reselect it
				this.select(newPosition);
			} else if (
				currentPosition >= 0 &&
				currentPosition < newComponents.length
			) {
				// Try to maintain the same position if it's still valid
				this.select(currentPosition);
			} else if (newComponents.length > 0) {
				// Fall back to first item
				this.select(0);
			} else {
				// No components available
				this.position = -1;
			}
		} else if (newComponents.length > 0) {
			// No previous selection, select first item
			this.select(0);
		} else {
			// No components available
			this.position = -1;
		}
	}

	/**
	 * Observes search results for changes
	 */
	observeSearchResults(): void {
		const searchGallery = document.querySelector(
			'section[data-uia="search-gallery"]',
		);

		if (!searchGallery) {
			return;
		}

		const callback = (mutationsList: MutationRecord[]) => {
			for (const mutation of mutationsList) {
				if (mutation.type === "childList") {
					// Search results have changed, refresh components
					this.refreshComponents();
				}
			}
		};

		this.resultsObserver = new MutationObserver(callback);
		this.resultsObserver.observe(searchGallery, {
			childList: true,
			subtree: true,
		});
	}
}
