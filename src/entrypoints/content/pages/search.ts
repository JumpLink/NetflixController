import { FeaturelessBrowse } from './featureless-browse.ts';

export class SearchBrowse extends FeaturelessBrowse {
    loaded: boolean;
    observer!: MutationObserver;

    constructor() {
        super();
        this.loaded = false;
        this.observeSearchResults();
    }

    static validatePath(path: string): boolean {
        return path.startsWith('/search');
    }

    onLoad(): void {
        super.onLoad();
        this.observer.disconnect();
    }

    isPageReady(): boolean {
        return super.isPageReady() && this.loaded;
    }

    // wait until search results are updated to load the page
    observeSearchResults(): void {
        const search = document.querySelector('.search');
        if (!search) {
            // Search element not found, mark as loaded immediately
            this.loaded = true;
            return;
        }
        const _this = this;
        const callback = (mutationsList: MutationRecord[]) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    _this.loaded = true;
                }
            }
        };
        this.observer = new MutationObserver(callback);
        this.observer.observe(search, { childList: true, subtree: true });
    }
}
