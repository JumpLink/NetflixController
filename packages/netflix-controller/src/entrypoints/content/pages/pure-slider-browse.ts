import { Slider } from "../components/slider.ts";
import { SliderBrowse } from "./slider-browse.ts";

export class PureSliderBrowse extends SliderBrowse {
	onLoad(): void {
		super.onLoad();
		this.addNavigatable(1, Slider.getSlider(this.loadingRow));
		this.setNavigatable(1);
	}
}
