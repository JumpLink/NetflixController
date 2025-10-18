import { GAMEPAD_BUTTONS } from "@ribajs/gamecontroller.js";
import type {
	EnterParams,
	ExitResult,
	Handler,
	NavigationAction,
	SliderData,
} from "../../../types/components.ts";
import { TitlePanel } from "./title-panel.ts";

declare let currentHandler: Handler;

/**
 * Netflix Jawbone Category Navigation Component
 *
 * Handles the expandable category navigation that appears above content sliders
 * on Netflix browse pages. The jawbone provides quick access to subcategories
 * within a main content category (e.g., "TV Shows" → "Action", "Comedy", "Drama").
 *
 * Netflix UI Target: The expandable horizontal menu that appears above content
 * rows when pressing left on a slider, showing subcategories like "Action",
 * "Comedy", "Drama" under main categories like "TV Shows" or "Movies".
 *
 * Features:
 * - Expandable/collapsible category navigation
 * - Integration with slider content filtering
 * - Tab-based subcategory selection
 * - Visual styling for active/inactive states
 * - Support for inline vs overlay jawbone modes
 */
export class Jawbone extends TitlePanel {
	jawbone: Element | null;
	inline: boolean;
	slider: SliderData | null;
	closed: boolean;
	replacedEarlierJawbone: boolean;
	tabPosition?: number;
	tabs?: NodeListOf<Element>;
	sliderPosition?: number;

	constructor(row: number, jawbone?: Element, slider?: SliderData) {
		super(row);
		this.jawbone = jawbone ?? null;
		this.inline = jawbone !== undefined;
		this.slider = slider ?? null;
		this.closed = false;
		this.replacedEarlierJawbone = false;

		if (this.slider) {
			this.slider.jawboneOpen = true;
		}

		if (this.inline) {
			this.replaceInlineJawbone();
		}

		// TODO implement support for Jawbone menu navigation
		// this.initTabs();
		// this.nextTabAction = {
		//     label: 'Next Tab',
		//     index: GAMEPAD_BUTTONS.BUMPER_RIGHT,
		//     onPress: () => this.selectTab(false)
		// };
		// this.prevTabAction = {
		//     label: 'Previous Tab',
		//     index: GAMEPAD_BUTTONS.BUMPER_LEFT,
		//     onPress: () => this.selectTab(true)
		// }
	}

	static getJawbone(row: number, slider?: SliderData): Jawbone | null {
		const rowNode = document.getElementById(`row-${row}`);
		if (rowNode) {
			const jawbone = rowNode.querySelector(".jawBoneContainer");
			if (jawbone) {
				return new Jawbone(row, jawbone, slider);
			}
		}
		return null;
	}

	initTabs(): void {
		this.tabPosition = -1;
		const panel = this.getPanelComponent();
		if (panel) {
			this.tabs = panel.querySelectorAll(".menu > li");
			if (this.tabs) {
				for (let i = 0; i < this.tabs.length; i++) {
					if (this.tabs[i]?.classList.contains("current")) {
						this.tabPosition = i;
						return;
					}
				}
			}
		}
	}

	replaceInlineJawbone(): void {
		if (currentHandler?.inlineJawbone) {
			const existingJawbone = currentHandler.inlineJawbone as Jawbone;
			currentHandler.removeNavigatable(existingJawbone);
			if (this.row !== existingJawbone.row) {
				if (existingJawbone.slider) {
					existingJawbone.slider.jawboneOpen = false;
				}
				// used to update position properly when setting position in SliderBrowse
				this.replacedEarlierJawbone =
					(this.row || 0) > (existingJawbone.row || 0);
			}
		}
		if (currentHandler) {
			currentHandler.inlineJawbone = this;
		}
	}

	getActions(): NavigationAction[] {
		const actions = super.getActions();
		if (this.inline) {
			actions.push({
				label: "Close",
				index: GAMEPAD_BUTTONS.BUTTON_LEFT,
				onPress: () => this.close(),
			});
		}
		// if (this.tabPosition > 0) {
		//     actions.push(this.prevTabAction);
		// }
		// if (this.tabPosition < this.tabs.length - 1) {
		//     actions.push(this.nextTabAction);
		// }
		return actions;
	}

	enter(params: EnterParams) {
		if ("position" in params && !("sliderPosition" in this)) {
			// track parent slider position for when jawbone closes
			this.sliderPosition = params.position;
		}
		super.enter(params);
	}

	exit(): ExitResult {
		super.exit();
		const params: ExitResult = { jawboneRow: this.row };
		if ("sliderPosition" in this) {
			params.position = this.sliderPosition;
		}
		if (this.closed) {
			params.jawboneClosed = true;
		}
		return params;
	}

	close() {
		const button = this.jawbone?.querySelector(".close-button");
		if (button) {
			(button as HTMLElement).click();
			this.closed = true;
			if (this.slider) {
				this.slider.jawboneOpen = false;
			}
			currentHandler.removeCurrentNavigatable();
		}
	}

	// selectTab(left) {
	//     let newPosition = this.tabPosition + (left ? 1 : -1);
	//     this.tabs[newPosition].click();
	// }

	getPanelComponent() {
		if (!this.jawbone) {
			// the title jawbone should be the first and only jawbone in the page
			this.jawbone = document.querySelector(".jawBoneContainer");
		}
		return this.jawbone;
	}

	getButtonSelector() {
		return ".jawbone-actions";
	}
}
