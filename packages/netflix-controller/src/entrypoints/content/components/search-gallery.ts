import type {
	InteractiveComponent,
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components.ts";
import type { PseudoStyler } from "../../../utils/pseudostyler.ts";
import { StaticNavigatable } from "./static-navigatable.ts";

export class SearchGallery extends StaticNavigatable {
	getComponents(): NavigatableComponent[] {
		return Array.from(
			document.querySelectorAll(
				'section[data-uia="search-gallery"] a[data-uia="search-gallery-video-card"]',
			),
		);
	}

	style(component: StyleableComponent, selected: boolean): void {
		(this.styler as PseudoStyler).toggleStyle(component, ":focus", selected);
	}

	interact(component: InteractiveComponent): void {
		component.click();
	}
}
