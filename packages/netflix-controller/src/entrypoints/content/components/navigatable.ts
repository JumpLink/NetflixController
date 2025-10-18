import type {
	EnterParams,
	ExitResult,
	NavigationAction,
	Styler,
} from "../../../types/components";

/**
 * Abstract Base Class for Netflix Navigatable UI Components
 *
 * Provides the foundation for all Netflix UI components that support gamepad navigation.
 * Any Netflix UI element that can be focused and navigated to must extend this class.
 *
 * Netflix UI Target: All interactive UI elements in Netflix that support gamepad
 * navigation, including sliders, buttons, modals, menus, and content grids.
 *
 * Core Navigation Methods:
 * - left()/right(): Horizontal navigation within components
 * - up()/down(): Vertical navigation between components
 * - enter(): Component activation/selection
 * - exit(): Component deactivation/cleanup
 *
 * Features:
 * - Abstract navigation interface for all UI components
 * - Styling support for focus states
 * - Lifecycle management (enter/exit)
 * - Integration with Netflix's navigation system
 */
export abstract class Navigatable {
	styler: Styler | null;

	constructor() {
		if (new.target === Navigatable) {
			throw new TypeError("cannot instantiate abstract Navigatable");
		}
		this.styler = null;
	}

	setStyler(styler: Styler): void {
		this.styler = styler;
	}

	abstract left(): void;

	abstract right(): void;

	abstract up(): void;

	abstract down(): void;

	abstract enter(params?: EnterParams): void;

	abstract exit(): ExitResult;

	cleanup(): void {
		// Base implementation does nothing
	}

	getActions(): NavigationAction[] {
		return [];
	}

	static mouseOver(element: Element): void {
		const mouseover = new MouseEvent("mouseover", { bubbles: true });
		element.dispatchEvent(mouseover);
	}

	static mouseOut(element: Element): void {
		const mouseout = new MouseEvent("mouseout", { bubbles: true });
		element.dispatchEvent(mouseout);
	}

	static scrollIntoView(element: Element): void {
		const bounds = element.getBoundingClientRect();
		const y =
			bounds.top + bounds.height / 2 + window.scrollY - window.innerHeight / 2;
		window.scroll({ top: y, behavior: "smooth" });
	}
}
