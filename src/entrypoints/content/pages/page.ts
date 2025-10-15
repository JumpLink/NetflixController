import type {
	EnterParams,
	ExitResult,
	NavigationAction,
} from "../../../types/components";
import PseudoStyler from "../../../utils/pseudostyler.ts";
import { DIRECTION } from "../components/direction.ts";
import type { Navigatable } from "../components/navigatable.ts";

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
			navigatable?.exit();
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
			if (this.position > 0) {
				this.setNavigatable(this.position - 1);
			}
		} else if (direction === DIRECTION.DOWN) {
			this.setNavigatable(this.position + 1);
		} else if (direction === DIRECTION.LEFT) {
			this.navigatables[this.position]?.left();
		} else if (direction === DIRECTION.RIGHT) {
			this.navigatables[this.position]?.right();
		}
	}
}
