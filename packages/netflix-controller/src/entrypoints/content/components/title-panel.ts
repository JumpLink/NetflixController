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
			console.log(`[TitlePanel] Looking for buttons in panel:`, panel);
			console.log(`[TitlePanel] Using selector: ${baseSelector}`);

			// Find primary button (can be button or a element)
			this.primaryButton = panel.querySelector(
				`${baseSelector} button.color-primary, ${baseSelector} a.playLink`,
			);
			console.log(`[TitlePanel] Primary button found:`, this.primaryButton);

			// Find secondary button
			this.secondaryButton = panel.querySelector(
				`${baseSelector} button.color-secondary`,
			);
			console.log(`[TitlePanel] Secondary button found:`, this.secondaryButton);
		} else {
			console.log(`[TitlePanel] No panel found`);
		}
	}

	getPanelComponent(): Element | null {
		throw new TypeError("must implement abstract TitlePanel#getPanelComponent");
	}

	getButtonSelector(): string {
		throw new TypeError("must implement abstract TitlePanel#getButtonSelector");
	}

	getComponents(): NavigatableComponent[] {
		const components = [this.primaryButton, this.secondaryButton].filter(
			(btn): btn is NavigatableComponent => btn !== null,
		);
		console.log(
			`[TitlePanel] Found ${components.length} navigatable components:`,
			components,
		);
		return components;
	}

	interact(component: InteractiveComponent): void {
		console.log(`[TitlePanel] Interacting with component:`, component);
		console.log(
			`[TitlePanel] Component is secondary button: ${component === this.secondaryButton}`,
		);
		console.log(
			`[TitlePanel] Component is primary button: ${component === this.primaryButton}`,
		);

		// Handle secondary button (Info button) - try both pointerdown and click
		if (component === this.secondaryButton) {
			console.log(`[TitlePanel] Triggering events on secondary button`);
			// Try pointerdown first (for modal trigger)
			component.dispatchEvent(
				new PointerEvent("pointerdown", { bubbles: true }),
			);
			// Also try click event as fallback
			setTimeout(() => {
				console.log(
					`[TitlePanel] Triggering click on secondary button as fallback`,
				);
				component.dispatchEvent(new MouseEvent("click", { bubbles: true }));
			}, 10);
		} else if (component === this.primaryButton) {
			// Handle primary button (Play link) - trigger click for navigation
			if (component instanceof HTMLAnchorElement) {
				console.log(`[TitlePanel] Triggering click on primary link`);
				// For links, trigger click event
				component.click();
			} else {
				console.log(
					`[TitlePanel] Using default interaction for primary button`,
				);
				// For buttons or other elements, use default behavior
				super.interact(component);
			}
		} else {
			console.log(`[TitlePanel] Using default interaction for other component`);
			// Handle other interactive elements
			super.interact(component);
		}
	}

	style(component: StyleableComponent, selected: boolean): void {
		if (this.styler) {
			this.styler.toggleStyle(component, ":hover", selected);
		}
	}
}
