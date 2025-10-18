import type {
	InteractiveComponent,
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components.ts";
import type { PseudoStyler } from "../../../utils/pseudostyler.ts";
import { StaticNavigatable } from "./static-navigatable.ts";

export class SearchGallery extends StaticNavigatable {
	private columnCount: number;
	private resizeHandler: () => void;

	constructor() {
		super();
		this.columnCount = this.calculateColumnCount();

		// Create a debounced resize handler
		this.resizeHandler = this.debounce(() => {
			this.columnCount = this.calculateColumnCount();
		}, 250);

		// Add resize event listener
		window.addEventListener("resize", this.resizeHandler);
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

	style(component: StyleableComponent, selected: boolean): void {
		(this.styler as PseudoStyler).toggleStyle(component, ":focus", selected);
	}

	interact(component: InteractiveComponent): void {
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
		const { row, column } = this.getRowAndColumn(this.position);

		if (row > 0) {
			// Move to the previous row in the same column
			this.select(this.getPositionFromRowAndColumn(row - 1, column));
		}
		// If at the top row, do nothing
	}

	/**
	 * Override down navigation to move to the item in the same column but next row
	 */
	down(): void {
		const { row, column } = this.getRowAndColumn(this.position);
		const nextRow = row + 1;
		const nextPosition = this.getPositionFromRowAndColumn(nextRow, column);

		// Check if next position exists and doesn't exceed the total number of items
		if (nextPosition < this.components.length) {
			this.select(nextPosition);
		}
		// If at the bottom row, do nothing
	}
}
