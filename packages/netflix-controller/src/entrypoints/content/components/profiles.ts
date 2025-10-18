import type {
	InteractiveComponent,
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components.ts";
import type { PseudoStyler } from "../../../utils/pseudostyler.ts";
import { StaticNavigatable } from "./static-navigatable.ts";

declare function runHandler(path: string, forceLoad: boolean): void;

/**
 * Netflix Profile Selection Grid Component
 *
 * Handles the grid of user profiles on Netflix's profile selection screen.
 * Displays available profiles as clickable avatars that users can select
 * to access their personalized Netflix experience.
 *
 * Netflix UI Target: The "Who's watching?" profile selection screen that appears
 * after login, showing:
 * - Profile avatars/images in a grid layout
 * - Profile names below each avatar
 * - "Add Profile" button for creating new profiles
 * - "Manage Profiles" link for profile management
 *
 * Features:
 * - Grid-based profile layout
 * - Profile avatar and name display
 * - Navigation to main Netflix interface after selection
 * - Integration with Netflix's profile system
 * - Support for different profile types (adult/kids)
 */
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
