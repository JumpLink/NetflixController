import type {
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components.ts";
import type { PseudoStyler } from "../../../utils/pseudostyler.ts";
import { StaticNavigatable } from "./static-navigatable.ts";

declare function getTransparentNetflixRed(opacity: number): string;

/**
 * Netflix Main Navigation Menu Component
 *
 * Handles the main navigation menu that appears at the top of Netflix pages.
 * Provides access to different sections like Home, TV Shows, Movies, My List, etc.
 *
 * Netflix UI Target: The horizontal navigation bar at the top of Netflix pages
 * containing menu items like:
 * - Home (main browse page)
 * - TV Shows
 * - Movies
 * - New & Popular
 * - My List
 * - Browse by Languages
 *
 * Features:
 * - Horizontal navigation between menu items
 * - Visual focus styling with Netflix red outline
 * - Integration with Netflix's menu system
 * - Support for active/selected menu states
 */
export class Menu extends StaticNavigatable {
	getComponents(): NavigatableComponent[] {
		return Array.from(document.querySelectorAll("li.navigation-tab a"));
	}

	style(component: StyleableComponent, selected: boolean): void {
		(this.styler as PseudoStyler).toggleStyle(component, ":hover", selected);
		if (selected) {
			component.style.cssText = `outline: 3px solid ${getTransparentNetflixRed(0.7)} !important`;
		} else {
			component.style.outline = "0";
		}
	}
}
