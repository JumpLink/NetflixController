import { Jawbone } from "../components/jawbone.ts";
import { Slider } from "../components/slider.ts";
import { SliderBrowse } from "./slider-browse.ts";

export class TitleBrowse extends SliderBrowse {
	constructor() {
		super(0);
	}

	onLoad(): void {
		super.onLoad();
		this.addNavigatable(1, new Jawbone(0));
		this.addNavigatable(2, Slider.getSlider(0));
		this.setNavigatable(1);
	}

	static validatePath(path: string): boolean {
		return path.startsWith("/title/");
	}

	// jawbone content loads after the rest of the page
	isPageReady(): boolean {
		return super.isPageReady() && !!document.querySelector(".jawbone-actions");
	}
}
