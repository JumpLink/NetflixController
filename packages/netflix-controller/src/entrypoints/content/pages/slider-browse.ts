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
		console.log(
			`[SliderBrowse] setNavigatable called, position: ${position}, current: ${this.position}, navigatables: ${this.navigatables.length}`,
		);

		if (position === this.position + 1) {
			// look for a jawbone if moving to the next navigatable below the current one
			// if a jawbone exists above the current nav, it will already exist in nav list
			const currentNav = this.navigatables[this.position];
			// Check if currentNav has a 'row' property (works with minified code)
			if (
				currentNav &&
				"row" in currentNav &&
				typeof currentNav.row === "number"
			) {
				const slider = currentNav as Slider;
				console.log(
					`[SliderBrowse] Current slider at row ${slider.row}, jawboneOpen: ${slider.jawboneOpen}`,
				);
				if (!slider.jawboneOpen) {
					// inline jawbone does not have its own row so we must check for it
					const jawbone = Jawbone.getJawbone(slider.row, slider);
					if (jawbone) {
						console.log(
							`[SliderBrowse] Found jawbone, replacedEarlierJawbone: ${jawbone.replacedEarlierJawbone}`,
						);
						if (jawbone.replacedEarlierJawbone) {
							position--;
						}
						this.addNavigatable(position, jawbone);
					}
				}
			}
		}
		if (!this.isNavigatable(position)) {
			console.log(
				`[SliderBrowse] Position ${position} not navigatable, getting next navigatable`,
			);
			// no jawbone found, check for other navigatables like slider/billboard
			const nextNav = this.getNextNavigatable();
			if (nextNav) {
				console.log(
					`[SliderBrowse] Found next navigatable, adding at position ${position}`,
				);
				this.addNavigatable(position, nextNav);
			} else {
				console.log("[SliderBrowse] No next navigatable found");
			}
		}
		if (this.isNavigatable(position)) {
			console.log(`[SliderBrowse] Calling super.setNavigatable(${position})`);
			super.setNavigatable(position);
		} else {
			console.log(
				`[SliderBrowse] Position ${position} still not navigatable after attempting to add`,
			);
		}
	}

	getNextNavigatable(): Navigatable | null {
		const currentNav = this.navigatables[this.position];
		console.log(
			`[SliderBrowse] getNextNavigatable - currentNav:`,
			currentNav?.constructor.name,
			"position:",
			this.position,
		);

		if (currentNav && "row" in currentNav) {
			const slider = currentNav as Slider;
			const nextRow = slider.row + 1;
			console.log(`[SliderBrowse] Looking for row-${nextRow}`);
			const rowNode = document.getElementById(`row-${nextRow}`);
			if (rowNode) {
				console.log(`[SliderBrowse] Found row-${nextRow}`);
				if (rowNode.querySelector(".slider")) {
					console.log(`[SliderBrowse] Found slider in row ${nextRow}`);
					return new Slider(nextRow, rowNode);
				}
				if (rowNode.querySelector(".billboard-title")) {
					console.log(`[SliderBrowse] Found billboard in row ${nextRow}`);
					return new Billboard(nextRow);
				}
				console.warn(`[SliderBrowse] Unknown contents in row ${nextRow}`);
			} else {
				console.log(`[SliderBrowse] No DOM node found for row-${nextRow}`);
			}
		} else {
			console.log("[SliderBrowse] Current nav has no row property");
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
