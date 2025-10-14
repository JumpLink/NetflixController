import { PureSliderBrowse } from './pure-slider-browse.js';

export class LatestBrowse extends PureSliderBrowse {
    constructor() {
        super(1);
    }

    static validatePath(path) {
        return path === '/latest';
    }
}
