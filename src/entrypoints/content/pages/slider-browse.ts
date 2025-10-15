import { Billboard } from "../components/billboard.js";
import { Jawbone } from "../components/jawbone.js";
import { Menu } from "../components/menu.js";
import type { Navigatable } from "../components/navigatable";
import { Slider } from "../components/slider.js";
import { NavigatablePage } from "./page.ts";

export class SliderBrowse extends NavigatablePage {
	loadingRow: number;
	currentRow: number;
	menu!: Menu;

	constructor(loadingRow: number) {
		if (new.target === SliderBrowse) {
			throw new TypeError("cannot instantiate abstract SliderPage");
		}
		super();
		this.loadingRow = loadingRow;
		this.currentRow = 0;
	}

	onLoad(): void {
		this.menu = new Menu();
		this.addNavigatable(0, this.menu);
	}

	setNavigatable(position: number): void {
		if (position === this.position + 1) {
			// look for a jawbone if moving to the next navigatable below the current one
			// if a jawbone exists above the current nav, it will already exist in nav list
			const currentNav = this.navigatables[this.position];
			if (currentNav && currentNav.constructor.name === "Slider") {
				const slider = currentNav as Slider;
				if (!slider.jawboneOpen) {
					// inline jawbone does not have its own row so we must check for it
					const jawbone = Jawbone.getJawbone(slider.row, slider);
					if (jawbone) {
						if (jawbone.replacedEarlierJawbone) {
							position--;
						}
						this.addNavigatable(position, jawbone);
					}
				}
			}
		}
		if (!this.isNavigatable(position)) {
			// no jawbone found, check for other navigatables like slider/billboard
			const nextNav = this.getNextNavigatable();
			if (nextNav) {
				this.addNavigatable(position, nextNav);
			}
		}
		if (this.isNavigatable(position)) {
			super.setNavigatable(position);
		}
	}

	getNextNavigatable(): Navigatable | null {
		const currentNav = this.navigatables[this.position];
		if (currentNav && "row" in currentNav) {
			const slider = currentNav as Slider;
			const nextRow = slider.row + 1;
			const rowNode = document.getElementById(`row-${nextRow}`);
			if (rowNode) {
				if (rowNode.querySelector(".slider")) {
					return new Slider(nextRow, rowNode);
				} else if (rowNode.querySelector(".billboard-title")) {
					return new Billboard(nextRow);
				} else {
					console.warn(`unknown contents in row ${nextRow}`);
				}
			}
		}
		return null;
	}

	// .mainView has additional children while loading, so wait until it has only 1.
	// additionally waits until the row content has loaded in by checking width.
	isPageReady(): boolean {
		if (window.isKeyboardActive?.()) {
			return false;
		}
		const mainView = document.querySelector(".mainView");
		if (mainView && mainView.childElementCount === 1) {
			const row = document.querySelector(`#row-${this.loadingRow}`);
			return row ? row.getBoundingClientRect().width > 0 : false;
		}
		return false;
	}

	needsPseudoStyler(): boolean {
		return true;
	}

	hasSearchBar(): boolean {
		return true;
	}
}
