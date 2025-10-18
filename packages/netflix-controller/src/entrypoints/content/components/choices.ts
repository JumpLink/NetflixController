import type {
	EnterParams,
	InteractiveComponent,
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components.ts";
import { StaticNavigatable } from "./static-navigatable.ts";

/**
 * Netflix Interactive Content Choice Component
 *
 * Handles interactive choice selection in Netflix's interactive/special
 * content (like Black Mirror: Bandersnatch or other choose-your-own-adventure
 * style content). Manages the selection of story branches and choices.
 *
 * Netflix UI Target: Interactive choice interfaces in special Netflix content,
 * typically showing:
 * - Multiple choice options for story branches
 * - Visual selection indicators
 * - Timed choice presentation
 * - Integration with Netflix's interactive content system
 *
 * Features:
 * - Choice selection with keyboard/gamepad input
 * - Visual focus management for choice options
 * - Timed choice presentation with delays
 * - MutationObserver for dynamic content loading
 * - Integration with Netflix's interactive story system
 */
export class InteractiveChoices extends StaticNavigatable {
	ready: boolean;
	dispatchKey: (keycode: number, shift: boolean) => void;

	constructor(dispatchKeyFunction: (keycode: number, shift: boolean) => void) {
		super();
		this.ready = false;
		this.dispatchKey = dispatchKeyFunction;
	}

	getComponents(): NavigatableComponent[] {
		return Array.from(
			document.querySelectorAll(".BranchingInteractiveScene--choice-selection"),
		);
	}

	interact(_component: InteractiveComponent): void {
		const keycode = "0".charCodeAt(0) + this.position + 1;
		this.dispatchKey(keycode, false);
	}

	// select if component has delay and return true, otherwise return false.
	// this delay is the time it takes for the component to load in visually.
	selectAfterDelay(target: Element): boolean {
		const delay = parseInt((target as HTMLElement).style.transitionDelay, 10);
		if (delay) {
			// extra 500ms necessary to avoid losing the focus we set
			setTimeout(() => {
				this.ready = true;
				this.select(0);
			}, delay + 500);
			return true;
		}
		return false;
	}

	enter(_params?: EnterParams): void {
		const loadTarget = this.components[0]?.parentElement;
		if (loadTarget && !this.selectAfterDelay(loadTarget)) {
			const observer = new MutationObserver(
				(mutations: MutationRecord[], observer: MutationObserver) => {
					for (const mutation of mutations) {
						if (this.selectAfterDelay(mutation.target as Element)) {
							observer.disconnect();
							break;
						}
					}
				},
			);
			observer.observe(loadTarget, {
				attributes: true,
				attributeFilter: ["style"],
			});
		}
	}

	style(component: StyleableComponent, selected: boolean): void {
		component.classList.toggle("focus", selected);
	}

	select(position: number): void {
		if (this.ready) {
			super.select(position);
		}
	}
}
