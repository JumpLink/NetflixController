import { GAMEPAD_BUTTONS } from "@ribajs/gamecontroller.js";
import type {
	EnterParams,
	ExitResult,
	Handler,
	NavigationAction,
} from "../../../types/components";
import type { ActionHandler } from "../../../types/handlers";
import { Navigatable } from "./navigatable.ts";

declare let actionHandler: ActionHandler;
declare let currentHandler: Handler;
declare function getTransparentNetflixRed(opacity: number): string;

export class Slider extends Navigatable {
	row: number;
	rowNode: Element;
	canShiftLeft: boolean;
	locked: boolean;
	jawboneOpen: boolean;
	jawboneAction: NavigationAction | null;
	position: number;
	sliderItem: Element | null;

	/**
	 * Creates the Slider at the given row and selects the given position in it.
	 */
	constructor(row: number, rowNode: Element, position?: number) {
		super();
		this.row = row;
		this.rowNode = rowNode;
		this.canShiftLeft = false;
		this.locked = false;
		this.jawboneOpen = false;
		this.position = 0;
		this.sliderItem = null;
		this.jawboneAction = {
			label: "Expand",
			index: GAMEPAD_BUTTONS.BUTTON_LEFT,
			onPress: () => this.openJawbone(),
		};

		if (position !== undefined) {
			this.selectPosition(position);
		}
	}

	/**
	 * Returns the slider at the given row if it exists.
	 * Sets that slider to the given position or the right-most position if not possible.
	 */
	static getSlider(row: number, position?: number): Slider | null {
		const rowNode = document.querySelector(`#row-${row}`);
		if (rowNode) {
			return new Slider(row, rowNode, position);
		}
		return null;
	}

	/**
	 * Selects the previous slider item.
	 */
	left(): void {
		this.select(false);
	}

	/**
	 * Selects the next slider item.
	 */
	right(): void {
		this.select(true);
	}

	/**
	 * Selects either this slider's first item or the item in the given position.
	 */
	enter(params?: EnterParams): void {
		if (params?.jawboneClosed) {
			this.jawboneOpen = false;
		}
		const jawboneRow = params?.jawboneRow ?? -1;
		if (
			params?.position !== undefined &&
			(jawboneRow === -1 || jawboneRow === this.row)
		) {
			let position = params.position;
			if (this.canShiftLeft) {
				position++; // partially-visible left slider item takes up a position if present
			}
			let found = false;
			while (!found) {
				if (this.hasPosition(position)) {
					found = true;
				} else {
					position--;
				}
			}
			this.selectPosition(position);
		} else {
			this.selectPosition(0);
		}
		this.scrollIntoView();
	}

	/**
	 * Unselects this slider and returns its position.
	 */
	exit(): ExitResult {
		this.unselect();
		let position = this.position;
		if (this.canShiftLeft) {
			position--; // partially-visible left slider item takes up a position if present
		}
		return { position: position };
	}

	getActions(): NavigationAction[] {
		const actions: NavigationAction[] = [
			{
				label: "Play",
				index: GAMEPAD_BUTTONS.BUTTON_BOTTOM,
				onPress: () => {
					this.clickHitzone(".previewModal--player_container");
				},
			},
		];
		if (!this.jawboneOpen && this.jawboneAction) {
			actions.push(this.jawboneAction);
		}
		return actions;
	}

	openJawbone(): void {
		if (!this.locked) {
			if (this.clickHitzone(".bob-jaw-hitzone")) {
				this.locked = true;
				if (this.jawboneAction) {
					actionHandler.removeAction(this.jawboneAction);
				}
				const jawboneContainer =
					this.rowNode.querySelector(".jawBoneContainer");
				if (jawboneContainer) {
					// wait for jawbone open transition to finish before giving jawbone focus
					const transition =
						window.getComputedStyle(jawboneContainer).transition;
					const pattern = new RegExp(/height (\d+(\.\d+)?)s/g);
					const matches = pattern.exec(transition);
					const heightDuration =
						matches && matches.length > 0 ? Number(matches[1]) * 1000 : 1000;
					setTimeout(() => {
						currentHandler.setNavigatable(currentHandler.position + 1);
						this.jawboneOpen = true;
						this.locked = false;
					}, heightDuration + 300); // extra 300ms for smoothness
				}
			}
		}
	}

	clickHitzone(selector: string): boolean {
		const hitzone = document.querySelector(selector);
		if (hitzone) {
			(hitzone as HTMLElement).click();
			return true;
		}
		return false;
	}

	getBoxArtContainer(sliderItem: Element): Element | null {
		const boxarts = sliderItem.querySelectorAll("div.boxart-container");
		// large title cards still have the small element; the last element is the larger one
		return boxarts[boxarts.length - 1];
	}

	/**
	 * Scrolls the viewport to be centered vertically on this slider.
	 */
	scrollIntoView(): void {
		if (this.sliderItem) {
			const boxart = this.getBoxArtContainer(this.sliderItem);
			if (boxart) {
				Navigatable.scrollIntoView(boxart);
			}
		}
	}

	/**
	 * Checks if this slider has the given position.
	 */
	hasPosition(position: number): boolean {
		return this.rowNode.querySelector(`.slider-item-${position}`) !== null;
	}

	/**
	 * Sends a mouseout event to the current item and a mouseover event to the item at the given position.
	 * These events initiate the selection animation from one slider item to the next.
	 */
	selectPosition(position: number): void {
		this.locked = true;
		this.unselect();
		const sliderItem = this.rowNode.querySelector(`.slider-item-${position}`);
		if (!sliderItem) return;
		// delay before sending mouseover necessary to avoid impacting animation
		setTimeout(() => {
			Navigatable.mouseOver(this.getEventTarget(sliderItem));
			this.locked = false;
		}, 100);
		this.sliderItem = sliderItem;
		this.position = position;
		const boxart = this.getBoxArtContainer(this.sliderItem);
		if (boxart) {
			(boxart as HTMLElement).style.outline =
				`3px solid ${getTransparentNetflixRed(0.7)}`;
		}
	}

	/**
	 * Unselects the currently selected item.
	 */
	unselect(): void {
		if (this.sliderItem) {
			Navigatable.mouseOut(this.getEventTarget(this.sliderItem));
			const boxart = this.getBoxArtContainer(this.sliderItem);
			if (boxart) {
				(boxart as HTMLElement).style.outline = "0";
			}
		}
	}

	/**
	 * Gets the given slider item's mouse event target.
	 */
	getEventTarget(sliderItem: Element): Element {
		return this.getBoxArtContainer(sliderItem)?.childNodes[0] as Element;
	}

	/**
	 * Selects either the next or previous slider element, shifting the slider if necessary.
	 */
	select(next: boolean): void {
		if (this.locked) {
			return; // another interaction is in progress; do not initiate a new one
		}
		let selected = false;
		const target = next
			? this.sliderItem?.nextElementSibling
			: this.sliderItem?.previousElementSibling;
		if (target) {
			const targetSibling = next
				? target.nextElementSibling
				: target.previousElementSibling;
			if (targetSibling) {
				if (targetSibling.classList.contains("slider-item-")) {
					// reached end of visible items
					this.locked = true;
					this.shiftSlider(next);
					setTimeout(() => {
						this.selectPosition(this.getShiftedPosition(target));
						this.locked = false;
					}, 800);
					selected = true;
				}
			}
			if (!selected) {
				this.selectPosition(this.position + (next ? 1 : -1));
				selected = true;
			}
		}
		if (selected && this.jawboneOpen) {
			// new jawbone is created in DOM so clear any existing one from navigation
			this.jawboneOpen = false; // still visible but needs to be reopened
			currentHandler.inlineJawbone = null;
			currentHandler.removeNavigatable(currentHandler.position + 1);
		}
		// if false, vibrate? cannot move slider
	}

	/**
	 * Gets the target's shifted position.
	 * If the target is at the beginning of the visible list, then its new position will be visibleCount - 2.
	 * If the target is at the end of the visible list, then its new position will be 1.
	 */
	getShiftedPosition(target: Element): number {
		let newPosition: number;
		const position = parseInt(
			(target as Element).className[(target as Element).className.length - 1],
			10,
		);
		if (position === 0) {
			const slider = this.rowNode.querySelector(".sliderContent");
			// count slider items ending in a number
			const visibleCount = Array.from(slider?.childNodes || []).reduce(
				(n, node) => {
					const lastChar = (node as Element).className[
						(node as Element).className.length - 1
					];
					return n + (lastChar >= "0" && lastChar <= "9" ? 1 : 0);
				},
				0,
			);
			newPosition = visibleCount - 2;
		} else {
			newPosition = 1;
		}
		return newPosition;
	}

	/**
	 * Shifts the slider forwards or backwards by clicking the proper control.
	 */
	shiftSlider(next: boolean): void {
		const handle = this.rowNode.querySelector(
			`span.handle${next ? "Next" : "Prev"}`,
		);
		if (handle) {
			(handle as HTMLElement).click();
		}
		this.canShiftLeft = true;
	}
}
