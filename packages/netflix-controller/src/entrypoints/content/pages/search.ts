import { SearchGallery } from "../components/search-gallery.ts";
import { NavigatablePage } from "./page.ts";

export class SearchBrowse extends NavigatablePage {
	loaded: boolean;
	observer!: MutationObserver | null;

	constructor() {
		super();
		this.loaded = false;
		this.observeSearchResults();
	}

	static validatePath(path: string): boolean {
		return path.startsWith("/search");
	}

	onLoad(): void {
		this.addNavigatable(0, new SearchGallery());
		this.setNavigatable(0);
		if (this.observer) {
			this.observer.disconnect();
		}
	}

	isPageReady(): boolean {
		// Wait for search results to load AND virtual keyboard to be closed
		if (window.isKeyboardActive?.()) {
			return false;
		}
		return this.loaded;
	}

	needsPseudoStyler(): boolean {
		return true;
	}

	hasSearchBar(): boolean {
		return true;
	}

	setNavigatable(position: number): void {
		if (position === 0) {
			super.setNavigatable(position);
		}
	}

	// wait until search results are updated to load the page
	observeSearchResults(): void {
		const search = document.querySelector(".search");
		if (!search) {
			// Search element not found, mark as loaded immediately
			this.loaded = true;
			// Initialize observer to null to indicate no observation is needed
			this.observer = null;
			return;
		}
		const callback = (mutationsList: MutationRecord[]) => {
			for (const mutation of mutationsList) {
				if (mutation.type === "childList") {
					this.loaded = true;
				}
			}
		};
		this.observer = new MutationObserver(callback);
		this.observer.observe(search, { childList: true, subtree: true });
	}
}
