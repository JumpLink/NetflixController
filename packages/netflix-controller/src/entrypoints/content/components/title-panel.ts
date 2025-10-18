import type {
	InteractiveComponent,
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components.ts";
import { StaticNavigatable } from "./static-navigatable.ts";

/**
 * Abstract Base Class for Netflix Title Panel Components
 *
 * Handles Netflix content panels that display title information, metadata,
 * and action buttons (Play, Add to List, etc.). Used for both billboard
 * banners and regular title rows.
 *
 * Netflix UI Target: Title information panels with action buttons that appear
 * when hovering/focusing on content items in browse pages, search results, etc.
 *
 * Features:
 * - Primary and secondary action button support
 * - Metadata display (title, description, rating, etc.)
 * - Focus management for button navigation
 * - Abstract methods for different panel types (billboard vs regular)
 */
export class TitlePanel extends StaticNavigatable {
	row?: number;
	primaryButton: Element | null;
	secondaryButton: Element | null;

	constructor(row?: number) {
		super();
		this.row = row;
		this.primaryButton = null;
		this.secondaryButton = null;

		const panel = this.getPanelComponent();
		const baseSelector = this.getButtonSelector();

		if (panel) {
			this.primaryButton = panel.querySelector(
				`${baseSelector} button.color-primary`,
			);
			this.secondaryButton = panel.querySelector(
				`${baseSelector} button.color-secondary`,
			);
		}
	}

	getPanelComponent(): Element | null {
		throw new TypeError("must implement abstract TitlePanel#getPanelComponent");
	}

	getButtonSelector(): string {
		throw new TypeError("must implement abstract TitlePanel#getButtonSelector");
	}

	getComponents(): NavigatableComponent[] {
		return [this.primaryButton, this.secondaryButton].filter(
			(btn): btn is NavigatableComponent => btn !== null,
		);
	}

	interact(component: InteractiveComponent): void {
		if (component === this.secondaryButton) {
			component.dispatchEvent(
				new PointerEvent("pointerdown", { bubbles: true }),
			);
		} else {
			super.interact(component);
		}
	}

	style(component: StyleableComponent, selected: boolean): void {
		if (this.styler) {
			this.styler.toggleStyle(component, ":hover", selected);
		}
	}
}
