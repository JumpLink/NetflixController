// Component interfaces for navigatable elements

// Forward declaration for PseudoStyler to avoid circular import
interface PseudoStyler {
	toggleStyle(element: Element, pseudoclass: string, force: boolean): void;
	loadDocumentStyles(): Promise<void>;
}

export interface NavigatableComponent extends Element {
	click(): void;
	classList: DOMTokenList;
	style: CSSStyleDeclaration;
}

export interface StyleableComponent extends NavigatableComponent {
	classList: DOMTokenList;
	style: CSSStyleDeclaration;
}

export interface InteractiveComponent extends NavigatableComponent {
	click(): void;
}

// Styler interface for pseudo-styler functionality
export interface Styler {
	toggleStyle(element: Element, pseudoclass: string, force: boolean): void;
	loadDocumentStyles(): Promise<void>;
}

// Action interface for navigation actions
export interface NavigationAction {
	label: string;
	index: number;
	onPress: () => void;
	onRelease?: () => void;
	hideHint?: boolean;
}

// Enter/exit parameters
export interface EnterParams {
	position?: number;
	sliderPosition?: number;
	jawboneRow?: number;
	jawboneClosed?: boolean;
}

export interface ExitResult {
	jawboneRow?: number;
	position?: number;
	jawboneClosed?: boolean;
}

// Forward declaration for page Navigatable to avoid circular import
interface PageNavigatable {
	left(): void;
	right(): void;
	enter(params?: EnterParams): void;
	exit(): ExitResult;
	getActions(): NavigationAction[];
}

// Handler interfaces
export interface Handler {
	inlineJawbone?: unknown;
	removeNavigatable(navigatable: PageNavigatable | number): void;
	removeCurrentNavigatable(): void;
	setNavigatable(position: number): void;
	position: number;
}

// Jawbone and slider interfaces
export interface JawboneData {
	jawboneOpen?: boolean;
}

export interface SliderData extends JawboneData {
	jawboneOpen: boolean;
}

export interface TabData {
	// Define tab structure as needed
	[key: string]: unknown;
}

// Page handler class type - forward declaration to avoid circular import
export interface NavigatablePage {
	navigatables: (PageNavigatable | null)[];
	loaded: boolean;
	unloaded: boolean;
	position: number;
	styler: PseudoStyler | null;
	load(): Promise<void>;
	unload(): void;
	onLoad(): void;
	onUnload(): void;
	loadPseudoStyler(): Promise<void>;
	waitUntilReady(): Promise<void>;
	setNavigatable(position: number): void;
	removeCurrentNavigatable(): void;
	addNavigatable(position: number, navigatable: PageNavigatable | null): void;
	removeNavigatable(arg: number | PageNavigatable): void;
	exit(): ExitResult;
	enter(params?: EnterParams): void;
	onInput(): void;
	getActions(): NavigationAction[];
	isPageReady(): boolean;
	needsPseudoStyler(): boolean;
	hasSearchBar(): boolean;
	hasPath(): boolean;
	isNavigatable(position: number): boolean;
	onDirectionAction(direction: number): void;
}

// UI component interfaces
export interface BottomBarComponent {
	element?: HTMLElement;
	add(): void;
	remove(): void;
}

export interface ActionHintsBar extends BottomBarComponent {
	update(actions: Record<number, NavigationAction>): void;
}

export interface ConnectionHintBar extends BottomBarComponent {
	show(): void;
	hide(): void;
}

export interface CompatibilityWarningBar extends BottomBarComponent {
	show(): void;
	hide(): void;
}

export interface ErrorBar extends BottomBarComponent {
	showError(message: string, duration?: number): void;
}
