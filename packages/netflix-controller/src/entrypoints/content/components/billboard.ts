import { TitlePanel } from "./title-panel.ts";

/**
 * Netflix Billboard Banner Component
 *
 * Handles the large featured content banner that appears at the top of
 * Netflix browse pages. This is typically the main hero section showcasing
 * a featured movie or TV show.
 *
 * Netflix UI Target: The large banner section at the top of browse pages
 * (usually row-0) that displays featured content with title, description,
 * and action buttons (Play, Add to List, etc.).
 *
 * Extends TitlePanel for action button management while providing
 * billboard-specific DOM selection logic.
 */
export class Billboard extends TitlePanel {
	getPanelComponent(): Element | null {
		const selector =
			this.row !== undefined ? `#row-${this.row}` : ".billboard-row";
		const billboard = document.querySelector(selector);
		console.log(`[Billboard] Looking for panel with selector: ${selector}`);
		console.log(`[Billboard] Panel found:`, billboard);
		return billboard;
	}

	getButtonSelector(): string {
		return ".billboard-links";
	}
}
