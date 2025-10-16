import type { PublicPath } from "wxt/browser";
import type { NavigationAction } from "../../../types/components";
import type { Settings } from "../../../types/settings";
import { gamepadMappings } from "../../../utils/gamepad-icons.ts";
import { StandardMapping } from "../../../utils/gamepads.ts";
import { DIRECTION } from "../components/direction.ts";
import { BottomBar } from "./bottom-bar.js";

const DIRECTION_MAP: Record<number, number> = {
	[StandardMapping.Button.D_PAD_UP]: DIRECTION.UP,
	[StandardMapping.Button.D_PAD_BOTTOM]: DIRECTION.DOWN,
	[StandardMapping.Button.D_PAD_LEFT]: DIRECTION.LEFT,
	[StandardMapping.Button.D_PAD_RIGHT]: DIRECTION.RIGHT,
};

/**
 * Action { label, index, onPress, onRelease, hideHint }
 */

export class ActionHandler {
	storage: Settings;
	hintsBar: ActionHintsBar;
	actions: Record<number, NavigationAction>;
	onDirection: ((direction: number) => void) | null;
	onInput: (() => void) | null;

	constructor(storage: Settings) {
		this.storage = storage;
		this.hintsBar = new ActionHintsBar(storage);
		this.actions = {};
		this.onDirection = null;
		this.onInput = null;
	}

	addAction(action: NavigationAction): void {
		this.actions[action.index] = action;
		this.updateHints();
	}

	removeAction(action: NavigationAction): void {
		delete this.actions[action.index];
		this.updateHints();
	}

	addAll(actions: NavigationAction[]): void {
		for (const action of actions) {
			this.actions[action.index] = action;
		}
		this.updateHints();
	}

	removeAll(actions: NavigationAction[]): void {
		for (const action of actions) {
			delete this.actions[action.index];
		}
		this.updateHints();
	}

	updateHints(): void {
		if (this.hintsBar) {
			this.hintsBar.update(this.actions);
		}
	}

	showHints(): void {
		this.hintsBar.add();
		this.updateHints();
	}

	hideHints(): void {
		this.hintsBar.remove();
	}

	onButtonPress(index: number): void {
		if (this.onInput) {
			this.onInput(); // non-specific activity callback
		}
		if (index in DIRECTION_MAP && this.onDirection) {
			this.onDirection(DIRECTION_MAP[index]);
		}
		if (index in this.actions) {
			this.actions[index].onPress?.();
		}
	}

	onButtonRelease(index: number): void {
		if (index in this.actions) {
			this.actions[index].onRelease?.();
		}
	}
}

export class ActionHintsBar extends BottomBar {
	storage: Settings;

	constructor(storage: Settings) {
		super();
		this.storage = storage;
	}

	createBar(): HTMLElement {
		const hintsBar = document.createElement("div");
		hintsBar.id = "gamepad-interface-hints-bar";
		hintsBar.classList.add("gamepad-interface-bar");
		return hintsBar;
	}

	createHint(action: NavigationAction): string | null {
		const buttonMapping = this.storage.buttonImageMapping || "Xbox One";
		const button = gamepadMappings.getButton(buttonMapping, action.index);
		if (button) {
			const imageSrc =
				browser.runtime.getURL(button.buttonImageSrc as PublicPath) ||
				button.buttonImageSrc;
			return `<div class='gamepad-interface-hint'>
                    <img src='${imageSrc}' alt='${button.buttonName}'>
                    ${action.label}
                </div>`;
		}
		return null;
	}

	update(actions: Record<number, NavigationAction>): void {
		if (this.element) {
			this.element.innerHTML = "";
			for (const action of Object.values(actions)) {
				if (action.hideHint !== false) {
					const hint = this.createHint(action);
					if (hint) {
						this.element.insertAdjacentHTML("beforeend", hint);
					}
				}
			}
		}
	}

	getPriority(): number {
		return 5;
	}
}
