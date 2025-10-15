import { PureSliderBrowse } from './pure-slider-browse.ts';

export class FeaturelessBrowse extends PureSliderBrowse {
    constructor() {
        super(0);
    }

    static validatePath(path: string): boolean {
        return path === '/browse/new-release' || path === '/browse/my-list';
    }
}
