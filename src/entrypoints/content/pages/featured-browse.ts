import { Billboard } from '../components/billboard.js';
import { Slider } from '../components/slider.js';
import { SliderBrowse } from './slider-browse.js';

export class FeaturedBrowse extends SliderBrowse {
    constructor() {
        super(1);
    }

    onLoad(): void {
        super.onLoad();
        this.addNavigatable(1, new Billboard());
        this.addNavigatable(2, Slider.getSlider(1));
        this.setNavigatable(1);
    }

    static validatePath(path: string): boolean {
        return path === '/browse' || path.startsWith('/browse/genre');
    }
}
