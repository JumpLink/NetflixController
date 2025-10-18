export class BottomBarContainer {
	children: BottomBar[];
	container: HTMLDivElement;

	constructor() {
		this.children = [];
		this.container = document.createElement("div");
		this.container.id = "gamepad-interface-bottom-bar-container";
		document.body.append(this.container);
	}

	build(): void {
		while (this.container.lastChild) {
			this.container.removeChild(this.container.lastChild);
		}
		this.children.sort((a, b) => b.getPriority() - a.getPriority());
		for (const child of this.children) {
			if (child.element) {
				this.container.append(child.element);
			}
		}
	}

	add(element: BottomBar): void {
		this.children.push(element);
		this.build();
	}

	remove(element: BottomBar): void {
		this.children = this.children.filter((e) => e !== element);
		this.build();
	}

	hide(): void {
		this.container.classList.add("gamepad-interface-hidden-faded");
	}

	show(): void {
		this.container.classList.remove("gamepad-interface-hidden-faded");
	}
}

export class BottomBar {
	static container: BottomBarContainer;
	element: HTMLElement | null;

	constructor() {
		if (new.target === BottomBar) {
			throw new TypeError("cannot instantiate abstract BottomBar");
		}
		if (!BottomBar.container) {
			BottomBar.container = new BottomBarContainer();
		}
		this.element = null;
	}

	createBar(): HTMLElement {
		throw new TypeError("must implement abstract BottomBar#createBar");
	}

	getPriority(): number {
		return 0;
	}

	add(): void {
		if (!this.element) {
			this.element = this.createBar();
			BottomBar.container.add(this);
		}
	}

	remove(): void {
		if (this.element) {
			BottomBar.container.remove(this);
			this.element = null;
		}
	}
}
