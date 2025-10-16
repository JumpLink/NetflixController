import type {
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components.ts";
import type { PseudoStyler } from "../../../utils/pseudostyler.ts";
import { StaticNavigatable } from "./static-navigatable.ts";

declare function getTransparentNetflixRed(opacity: number): string;

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
