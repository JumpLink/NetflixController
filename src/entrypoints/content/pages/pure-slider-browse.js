import { Slider } from '../components/slider.js';
import { SliderBrowse } from './slider-browse.js';

export class PureSliderBrowse extends SliderBrowse {
    constructor(loadingRow) {
        super(loadingRow);
    }

    onLoad() {
        super.onLoad();
        this.addNavigatable(1, Slider.getSlider(this.loadingRow));
        this.setNavigatable(1);
    }
}