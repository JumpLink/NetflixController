import { FeaturelessBrowse } from './featureless-browse.js';

export class SearchBrowse extends FeaturelessBrowse {
    constructor() {
        super();
        this.loaded = false;
        this.observeSearchResults();
    }

    static validatePath(path) {
        return path.startsWith('/search');
    }

    onLoad() {
        super.onLoad();
        this.observer.disconnect();
    }

    isPageReady() {
        return super.isPageReady() && this.loaded;
    }

    // wait until search results are updated to load the page
    observeSearchResults() {
        let search = document.querySelector('.search');
        if (!search) {
            // Search element not found, mark as loaded immediately
            this.loaded = true;
            return;
        }
        let _this = this;
        let callback = mutationsList => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    _this.loaded = true;
                }
            }
        }
        this.observer = new MutationObserver(callback);
        this.observer.observe(search, { childList: true, subtree: true });
    }
}
