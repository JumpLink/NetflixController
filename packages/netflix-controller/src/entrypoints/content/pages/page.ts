import type {
	EnterParams,
	ExitResult,
	NavigationAction,
} from "../../../types/components";
import { PseudoStyler } from "../../../utils/pseudostyler.ts";
import { InteractiveChoices } from "../components/choices.ts";
import { DIRECTION } from "../components/direction.ts";
import { ModalContainer } from "../components/modal-container.ts";
import { ModalEpisodeList } from "../components/modal-episode-list.ts";
import { ModalSimilarTitles } from "../components/modal-similar-titles.ts";
import type { Navigatable } from "../components/navigatable.ts";
import { SearchGallery } from "../components/search-gallery.ts";

export class NavigatablePage {
	navigatables: (Navigatable | null)[];
	loaded: boolean;
	unloaded: boolean;
	position: number;
	styler: PseudoStyler | null;

	constructor() {
		if (new.target === NavigatablePage) {
			throw new TypeError("cannot instantiate abstract NavigatablePage");
		}
		this.navigatables = [];
		this.loaded = false;
		this.unloaded = false;
		this.position = 0;
		this.styler = null;
	}

	async load(): Promise<void> {
		await Promise.all([this.loadPseudoStyler(), this.waitUntilReady()]);
		if (!this.unloaded) {
			this.onLoad();
			window.actionHandler.addAll(this.getActions());
			window.actionHandler.onInput = () => this.onInput();
			this.loaded = true;
		}
	}

	// to be implemented by subclass
	onLoad(): void {}

	async loadPseudoStyler(): Promise<void> {
		if (this.needsPseudoStyler()) {
			this.styler = new PseudoStyler();
			return this.styler.loadDocumentStyles();
		}
		return Promise.resolve();
	}

	// via https://stackoverflow.com/a/30506051/1247781
	waitUntilReady(): Promise<void> {
		const _this = this;
		return new Promise<void>((resolve) => {
			(function checkReadiness() {
				if (_this.unloaded || _this.isPageReady()) {
					return resolve();
				}
				setTimeout(checkReadiness, 50);
			})();
		});
	}

	unload(): void {
		this.unloaded = true;
		if (this.loaded) {
			this.onUnload();
		}
	}

	// to be overriden by subclasses
	onUnload(): void {
		this.navigatables.forEach((navigatable) => {
			// Call exit to handle component state cleanup
			navigatable?.exit();

			// Call cleanup if it's a Navigatable to handle resource cleanup
			if (navigatable && typeof navigatable.cleanup === "function") {
				navigatable.cleanup();
			}
		});
		window.actionHandler.removeAll(this.getActions());
		window.actionHandler.onInput = null;
	}

	// to be overriden by subclasses
	isPageReady(): boolean {
		return true;
	}

	// to be overriden by subclasses
	needsPseudoStyler(): boolean {
		return false;
	}

	// to be overriden by subclasses
	hasSearchBar(): boolean {
		return false;
	}

	hasPath(): boolean {
		return true;
	}

	// to be overriden by subclasses
	onInput(): void {}

	// to be overriden by subclasses
	getActions(): NavigationAction[] {
		return [];
	}

	// static validatePath(path) must be implemented by subclasses

	isNavigatable(position: number): boolean {
		return position < this.navigatables.length;
	}

	setNavigatable(position: number): void {
		if (!this.isNavigatable(position)) {
			throw new Error(`no navigatable at position ${position}`);
		}
		const params = this.exit();
		this.position = position;
		this.enter(params);
	}

	addNavigatable(position: number, navigatable: Navigatable | null): void {
		if (this.styler && navigatable !== null) {
			navigatable.styler = this.styler;
		}
		this.navigatables.splice(position, 0, navigatable);
	}

	removeNavigatable(arg: number | Navigatable): void {
		let position = arg;
		if (typeof arg === "object") {
			// find and remove object argument
			position = this.navigatables.indexOf(arg);
		}
		if (typeof position === "number" && position >= 0) {
			this.navigatables.splice(position, 1);
		}
	}

	removeCurrentNavigatable(): void {
		const params = this.exit();
		this.removeNavigatable(this.position);
		this.position--;
		this.enter(params);
	}

	exit(): ExitResult {
		if (this.navigatables[this.position]) {
			const exitParams = this.navigatables[this.position]?.exit();
			window.actionHandler.removeAll(
				this.navigatables[this.position]?.getActions(),
			);
			if (exitParams) {
				return exitParams;
			}
		}
		return {};
	}

	enter(params: EnterParams): void {
		if (this.navigatables[this.position]) {
			this.navigatables[this.position]?.enter(params);
			window.actionHandler.addAll(
				this.navigatables[this.position]?.getActions(),
			);
		}
	}

	onDirectionAction(direction: number): void {
		if (direction === DIRECTION.UP) {
			// Check if current navigatable has a custom up() implementation
			const currentNav = this.navigatables[this.position];
			const componentName = currentNav?.constructor.name || "none";
			console.log(
				`[Page] UP pressed, position: ${this.position}, component: ${componentName}`,
			);

			if (currentNav && this.navigatableHandlesDirection(currentNav, "up")) {
				// Navigatable handles up navigation internally
				console.log(`[Page] Component handles UP internally`);
				currentNav.up();
			} else {
				// Fall back to previous navigatable if current one doesn't handle up
				const prevPosition = this.position - 1;
				if (prevPosition >= 0) {
					console.log(
						`[Page] Moving to previous navigatable at position ${prevPosition}`,
					);
					this.setNavigatable(prevPosition);
				} else {
					console.log(`[Page] Already at first navigatable, cannot move up`);
				}
			}
		} else if (direction === DIRECTION.DOWN) {
			// Check if current navigatable has a custom down() implementation
			const currentNav = this.navigatables[this.position];
			const componentName = currentNav?.constructor.name || "none";
			console.log(
				`[Page] DOWN pressed, position: ${this.position}, component: ${componentName}, total: ${this.navigatables.length}`,
			);

			if (currentNav && this.navigatableHandlesDirection(currentNav, "down")) {
				// Navigatable handles down navigation internally
				console.log(`[Page] Component handles DOWN internally`);
				currentNav.down();
			} else {
				// Fall back to next navigatable if current one doesn't handle down
				// Always call setNavigatable even if we're at the last position
				// This allows subclasses like SliderBrowse to dynamically load more navigatables
				const nextPosition = this.position + 1;
				console.log(
					`[Page] Attempting to navigate to position ${nextPosition} (current length: ${this.navigatables.length})`,
				);
				this.setNavigatable(nextPosition);
			}
		} else if (direction === DIRECTION.LEFT) {
			this.navigatables[this.position]?.left();
		} else if (direction === DIRECTION.RIGHT) {
			this.navigatables[this.position]?.right();
		}
	}

	/**
	 * Check if a navigatable has a custom implementation of a direction method
	 * (not just the base no-op implementation from Slider or base class)
	 */
	private navigatableHandlesDirection(
		navigatable: Navigatable,
		_direction: "up" | "down",
	): boolean {
		// Use instanceof checks instead of constructor.name
		// This works reliably even with minified code
		//
		// Only these components handle their own up/down navigation internally
		// These have custom up/down logic that navigates within themselves (e.g., grids, lists)
		//
		// All other components delegate to the page (Slider, Billboard, TitlePanel, Menu,
		// Jawbone, ModalButtonRow, etc.) - they only handle left/right navigation

		if (
			navigatable instanceof SearchGallery ||
			navigatable instanceof ModalContainer ||
			navigatable instanceof ModalEpisodeList ||
			navigatable instanceof ModalSimilarTitles ||
			navigatable instanceof InteractiveChoices
		) {
			return true;
		}

		// Default: delegate to page-level navigation
		// This is safe even for minified code where class names are shortened
		// Note: Even if a component has up/down methods, we default to delegating
		// to avoid components with empty stub methods incorrectly "handling" navigation
		return false;
	}
}
