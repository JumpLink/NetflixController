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

	getSelectedComponent(): NavigatableComponent {
		return this.components[this.position];
	}

	// can be overriden for custom style component
	getStyleComponent(): StyleableComponent {
		return this.getSelectedComponent() as StyleableComponent;
	}

	// can be overriden for custom interaction component
	getInteractionComponent(): InteractiveComponent {
		return this.getSelectedComponent() as InteractiveComponent;
	}

	// can be overriden for custom interaction
	interact(component: InteractiveComponent): void {
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
			const component = this.getStyleComponent();
			this.style(component, false);
			component.style.outline = "0";
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
		this.unselect();
		this.position = position;
		const component = this.getStyleComponent();
		this.style(component, true);
		component.style.outline = `3px solid ${getTransparentNetflixRed(0.7)}`;
		if (this.shouldScrollIntoView()) {
			Navigatable.scrollIntoView(this.getStyleComponent());
		}
	}
}
