import type {
	InteractiveComponent,
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components.ts";
import type PseudoStyler from "../../../utils/pseudostyler.ts";
import { StaticNavigatable } from "./static-navigatable.ts";

declare function runHandler(path: string, forceLoad: boolean): void;

export class Profiles extends StaticNavigatable {
	getComponents(): NavigatableComponent[] {
		return Array.from(
			document.querySelectorAll(".choose-profile a.profile-link"),
		);
	}

	style(component: StyleableComponent, selected: boolean): void {
		(this.styler as PseudoStyler).toggleStyle(component, ":hover", selected);
	}

	interact(component: InteractiveComponent): void {
		super.interact(component);
		runHandler(window.location.pathname, true);
	}
}
