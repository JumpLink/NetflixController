import type {
	EnterParams,
	ExitResult,
	InteractiveComponent,
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components";
import { StaticNavigatable } from "./static-navigatable.ts";

/**
 * Netflix Modal Content Collections Component
 *
 * Handles navigation for various content collection sections in Netflix detail modals,
 * including "More Like This", Collections, and Trailers. Displays related content
 * in grid layouts based on the currently viewed movie or TV show.
 *
 * Netflix UI Target: Various content collection sections in detail modals:
 * - "More Like This" / "Similar Titles" (recommendations)
 * - Collections (related content groupings)
 * - Trailers and More (trailer/preview content)
 *
 * Features:
 * - Horizontal scrolling through content collections
 * - Responsive grid layout adapting to available space
 * - Integration with Netflix's content recommendation system
 * - Visual styling consistent with Netflix's design
 * - Support for movies, TV shows, and trailer content
 * - Dynamic content loading and responsive column adjustment
 */
export class ModalSimilarTitles extends StaticNavigatable {
	private modal: HTMLElement;
	private similarTitlesContainer: HTMLElement | null = null;
	private columnCount: number = 1;
	private resizeObserver: ResizeObserver | null = null;
	private readonly containerType: string;

	constructor(modal: HTMLElement, containerType?: string) {
		super();
		this.modal = modal;
		this.containerType = containerType || "auto";

		// Find the appropriate container based on type or auto-detect
		this.similarTitlesContainer = this.findContainer();

		console.log(
			`[ModalSimilarTitles] Created for type: ${this.containerType}, found container:`,
			this.similarTitlesContainer,
		);

		// Setup resize observer to recalculate columns
		this.setupResizeObserver();
	}

	/**
	 * Get the container type for this instance
	 */
	public getContainerType(): string {
		return this.containerType;
	}

	/**
	 * Find the appropriate container based on the specified type
	 */
	private findContainer(): HTMLElement | null {
		const selectors = {
			similar: ".moreLikeThis--container",
			collection: ".titleGroup--container",
			trailers: ".trailersAndMore--container",
			auto: ".moreLikeThis--container, .titleGroup--container, .trailersAndMore--container",
		};

		const selector =
			selectors[this.containerType as keyof typeof selectors] || selectors.auto;
		return this.modal.querySelector(selector) as HTMLElement;
	}

	/**
	 * Set up resize observer to update column count
	 */
	private setupResizeObserver(): void {
		if (!this.similarTitlesContainer) return;

		// Calculate initial column count
		this.calculateColumnCount();

		// Set up resize observer
		this.resizeObserver = new ResizeObserver(() => {
			this.calculateColumnCount();
		});

		// Start observing the container
		this.resizeObserver.observe(document.body);
	}

	/**
	 * Calculate the number of columns based on body width
	 */
	private calculateColumnCount(): void {
		const width = document.body.clientWidth;

		if (width < 343) {
			this.columnCount = 1;
		} else if (width < 799) {
			this.columnCount = 2;
		} else {
			this.columnCount = 3;
		}
	}

	/**
	 * Get all similar title items as navigatable components
	 */
	getComponents(): NavigatableComponent[] {
		if (!this.similarTitlesContainer) return [];

		// Choose selector based on container type
		const selector =
			this.containerType === "trailers"
				? '.trailers-and-more-item .titleCard--container[role="button"]'
				: '.titleCard--container[role="button"]';

		const titleItems = this.similarTitlesContainer.querySelectorAll(
			selector,
		) as NodeListOf<HTMLElement>;

		console.log(
			`[ModalSimilarTitles] Found ${titleItems.length} title cards in ${this.containerType} container`,
		);
		return Array.from(titleItems);
	}

	/**
	 * Style the selected title
	 */
	style(component: StyleableComponent | null, selected: boolean): void {
		if (!component) return;

		if (this.styler) {
			this.styler.toggleStyle(component, ":hover", selected);
		}

		// Style specifically the image wrapper inside the component
		const imageWrapper = component.querySelector(
			".titleCard-imageWrapper",
		) as HTMLElement;

		if (imageWrapper) {
			if (selected) {
				imageWrapper.style.outline = "3px solid rgba(229, 9, 20, 0.7)";
			} else {
				imageWrapper.style.outline = "";
			}
		}
	}

	/**
	 * Handle interaction with a title
	 */
	interact(component: InteractiveComponent | null): void {
		if (!component) {
			component = this.getSelectedComponent() as InteractiveComponent;
			if (!component) return;
		}

		// Check if the component is still in the DOM
		if (!component.isConnected) {
			console.warn("Attempted to interact with a detached title component");
			return;
		}

		component.click();
	}

	/**
	 * Get row and column from position
	 */
	private getRowAndColumn(position: number): { row: number; column: number } {
		return {
			row: Math.floor(position / this.columnCount),
			column: position % this.columnCount,
		};
	}

	/**
	 * Get position from row and column
	 */
	private getPositionFromRowAndColumn(row: number, column: number): number {
		return row * this.columnCount + column;
	}

	/**
	 * Handle up navigation in the grid
	 */
	up(): void {
		// Get current row and column
		const { row, column } = this.getRowAndColumn(this.position);

		if (row > 0) {
			// Move up one row, keeping the same column
			const newPosition = this.getPositionFromRowAndColumn(row - 1, column);

			// Check if the new position is valid
			if (newPosition >= 0 && newPosition < this.components.length) {
				this.select(newPosition);
			}
		}
	}

	/**
	 * Handle down navigation in the grid
	 */
	down(): void {
		// Get current row and column
		const { row, column } = this.getRowAndColumn(this.position);

		// Calculate the position one row down
		const newPosition = this.getPositionFromRowAndColumn(row + 1, column);

		// Check if the new position is valid
		if (newPosition >= 0 && newPosition < this.components.length) {
			this.select(newPosition);
		}
	}

	/**
	 * Handle left navigation in the grid
	 */
	left(): void {
		if (this.position % this.columnCount > 0) {
			// If not at the leftmost column, move left
			this.select(this.position - 1);
		}
	}

	/**
	 * Handle right navigation in the grid
	 */
	right(): void {
		if (
			this.position % this.columnCount < this.columnCount - 1 &&
			this.position < this.components.length - 1
		) {
			// If not at the rightmost column and not at the end, move right
			this.select(this.position + 1);
		}
	}

	/**
	 * Initialize the component
	 */
	enter(_params?: EnterParams): void {
		// Update column count
		this.calculateColumnCount();

		// Select first title
		this.select(0);
	}

	/**
	 * Clean up when exiting
	 */
	exit(): ExitResult {
		this.unselect();
		this.position = -1;
		return {};
	}

	/**
	 * Clean up resources when no longer needed
	 */
	cleanup(): void {
		// Clean up resize observer
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
	}

	/**
	 * Override the select method to add scrolling
	 */
	select(position: number): void {
		super.select(position);
		this.scrollSelectedIntoView();
	}

	/**
	 * Scroll the selected title into view
	 */
	private scrollSelectedIntoView(): void {
		const component = this.getSelectedComponent();
		if (!component || !this.similarTitlesContainer) return;

		// Use the Navigatable.scrollIntoView static method for consistency
		// This will scroll the main page to bring the component into view
		if (component.getBoundingClientRect) {
			// Calculate if element is partially or fully out of view
			const containerRect = this.similarTitlesContainer.getBoundingClientRect();
			const componentRect = component.getBoundingClientRect();

			// If element is not fully visible in the container
			if (
				componentRect.bottom > containerRect.bottom ||
				componentRect.top < containerRect.top
			) {
				// We need to scroll the component into view within the container
				component.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
				});
			}
		}
	}
}
