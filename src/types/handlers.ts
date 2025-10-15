// Handler related types

export interface PageHandler {
	name: string;
	validatePath(path: string): boolean;
	hasPath(): boolean;
	hasSearchBar(): boolean;
	load(): Promise<void>;
	unload(): void;
}

export interface Action {
	label: string;
	index: number;
	onPress: () => void;
}

export interface ActionHandler {
	addAction(action: Action): void;
	addAll(actions: Action[]): void;
	removeAction(action: Action): void;
	removeAll(actions: Action[]): void;
	updateHints(): void;
	showActionHints: boolean;
	onInput?: () => void;
}

export interface Direction {
	UP: string;
	DOWN: string;
	LEFT: string;
	RIGHT: string;
}

export interface KeyboardNavigatable {
	focusElement(element: Element): void;
	focusNext(direction: keyof Direction): void;
	focusPrevious(direction: keyof Direction): void;
	selectFocused(): void;
	getFocusedElement(): Element | null;
}

export interface VirtualKeyboard {
	show(element: HTMLInputElement): void;
	hide(): void;
	isActive: boolean;
}

export interface UIComponent {
	show(): void;
	hide(): void;
}
