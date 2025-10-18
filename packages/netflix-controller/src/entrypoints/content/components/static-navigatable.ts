import { GAMEPAD_BUTTONS } from "@ribajs/gamecontroller.js";
import type {
	EnterParams,
	ExitResult,
	InteractiveComponent,
	NavigatableComponent,
	NavigationAction,
	StyleableComponent,
} from "../../../types/components";
import { Navigatable } from "./navigatable.ts";

// Import from content/index.ts - this would normally be a separate utility
declare function getTransparentNetflixRed(opacity: number): string;

/**
 * Abstract Base Class for Netflix Static Navigatable Components
 *
 * Extends Navigatable for components that have a fixed set of navigatable
 * elements that don't change during runtime. These components typically
 * represent static UI elements like menus, button rows, or content grids.
 *
 * Netflix UI Target: Static UI elements with fixed navigation structure,
 * such as menus, button rows, profile grids, and content selection grids.
 *
 * Features:
 * - Fixed component list that doesn't change at runtime
 * - Position-based navigation within the component list
 * - Abstract getComponents() method for defining navigatable elements
 * - Focus styling and state management
 * - Integration with Netflix's static navigation patterns
 */
export abstract class StaticNavigatable extends Navigatable {
	position: number;
	_components: NavigatableComponent[] | null = null;

	constructor() {
		super();
		this.position = -1;
	}

	get components(): NavigatableComponent[] {
		if (!this._components) {
			this._components = this.getComponents();
		}
		return this._components;
	}

	abstract getComponents(): NavigatableComponent[];

	getSelectedComponent(): NavigatableComponent | null {
		// Check if position is valid
		if (this.position < 0 || this.position >= this.components.length) {
			return null;
		}
		return this.components[this.position];
	}

	// can be overriden for custom style component
	getStyleComponent(): StyleableComponent | null {
		const component = this.getSelectedComponent();
		return component ? (component as StyleableComponent) : null;
	}

	// can be overriden for custom interaction component
	getInteractionComponent(): InteractiveComponent | null {
		const component = this.getSelectedComponent();
		return component ? (component as InteractiveComponent) : null;
	}

	// can be overriden for custom interaction
	interact(component: InteractiveComponent | null): void {
		if (!component) {
			return;
		}

		// Check if the component is still in the DOM
		if (!component.isConnected) {
			console.warn("Attempted to interact with a detached component");
			return;
		}

		component.click();
	}

	// can be overriden for custom styling, such as with pseudo-styler
	style(_component: StyleableComponent, _selected: boolean): void {}

	// can be overriden to disable scrolling into view when selected
	shouldScrollIntoView(): boolean {
		return true;
	}

	left(): void {
		if (this.position > 0) {
			this.select(this.position - 1);
		}
	}

	right(): void {
		if (this.position < this.components.length - 1) {
			this.select(this.position + 1);
		}
	}

	up(): void {
		// Base implementation does nothing - should be overridden by grid layouts
	}

	down(): void {
		// Base implementation does nothing - should be overridden by grid layouts
	}

	enter(_params?: EnterParams): void {
		this.select(0);
	}

	exit(): ExitResult {
		this.unselect();
		this.position = -1;
		return {};
	}

	getActions(): NavigationAction[] {
		return [
			{
				label: "Select",
				index: GAMEPAD_BUTTONS.BUTTON_BOTTOM,
				onPress: () => this.interact(this.getInteractionComponent()),
			},
		];
	}

	unselect(): void {
		if (this.position >= 0) {
			try {
				const component = this.getStyleComponent();
				if (component) {
					this.style(component, false);

					// Make sure the component is still connected to the DOM
					if (component.isConnected) {
						component.style.outline = "0";
					}
				}
			} catch (error) {
				// Silently catch errors if component is no longer valid
				console.warn(
					"Error during unselect - component may have been removed",
					error,
				);
			}
		}
	}

	/**
	 * Clean up any resources (event listeners, etc.) when this navigatable is no longer needed
	 * Override in subclasses if needed
	 */
	cleanup(): void {
		// Base implementation does nothing
	}

	select(position: number): void {
		// First make sure we unselect any current selection
		this.unselect();

		// Set the new position
		this.position = position;

		try {
			// Check if position is valid
			if (position < 0 || position >= this.components.length) {
				console.warn(
					`Invalid position ${position}, max is ${this.components.length - 1}`,
				);
				return;
			}

			// Get and validate component
			const component = this.getStyleComponent();
			if (!component || !component.isConnected) {
				console.warn("Component is not valid or not connected to the DOM");
				return;
			}

			// Apply style
			this.style(component, true);

			// Add outline - only if component is still connected to the DOM
			component.style.outline = `3px solid ${getTransparentNetflixRed(0.7)}`;

			// Scroll into view if needed
			if (this.shouldScrollIntoView()) {
				Navigatable.scrollIntoView(component);
			}
		} catch (error) {
			console.warn("Error during select", error);
			// Reset position on error
			this.position = -1;
		}
	}
}
