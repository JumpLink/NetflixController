import { PureSliderBrowse } from './pure-slider-browse.ts';

export class LatestBrowse extends PureSliderBrowse {
    constructor() {
        super(1);
    }

    static validatePath(path: string): boolean {
        return path === '/latest';
    }
}
