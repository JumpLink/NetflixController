import { GAMEPAD_BUTTONS } from "@ribajs/gamecontroller.js";
import type { NavigationAction } from "../../../types/components";
import type { Settings } from "../../../types/settings";
import { InteractiveChoices } from "../components/choices.ts";
import { ActionHandler } from "../ui/actions.js";
import { BottomBar } from "../ui/bottom-bar.js";
import { NavigatablePage } from "./page.ts";

export class WatchVideo extends NavigatablePage {
	player: Element | null;
	sizingWrapper: Element | null;
	inactivityTimer: number | null;
	postplay: boolean;
	hasInteractiveChoices: boolean;
	hasNextEpisode: boolean;
	hasSkipIntro: boolean;
	controlObserver!: MutationObserver;
	skipObserver!: MutationObserver;
	interactiveObserver!: MutationObserver;
	backAction: NavigationAction;
	skipIntroAction: NavigationAction;
	nextEpisodeAction: NavigationAction;
	actionHandler: ActionHandler;

	constructor() {
		super();
		this.player = null;
		this.sizingWrapper = null;
		this.inactivityTimer = null;
		this.postplay = false;
		this.hasInteractiveChoices = false;
		// this.hasPreviousEpisode = true;
		this.hasNextEpisode = true;
		this.hasSkipIntro = false;
		this.backAction = {
			label: "Back",
			index: GAMEPAD_BUTTONS.BUTTON_RIGHT,
			onPress: () => this.goBack(),
		};
		this.skipIntroAction = {
			label: "Skip Intro",
			index: GAMEPAD_BUTTONS.BUTTON_CONTROL_RIGHT,
			onPress: () => this.skipIntro(),
		};
		// this.previousEpisodeAction = {
		//     label: 'Previous Episode',
		//     index: GAMEPAD_BUTTONS.BUMPER_LEFT,
		//     onPress: () => this.openPreviousEpisode()
		// };
		this.nextEpisodeAction = {
			label: "Next Episode",
			index: GAMEPAD_BUTTONS.BUMPER_RIGHT,
			onPress: () => this.openNextEpisode(),
		};
		this.actionHandler = new ActionHandler(storage as unknown as Settings);
	}

	static validatePath(path: string): boolean {
		return path.startsWith("/watch");
	}

	onLoad(): void {
		super.onLoad();
		// The sizing wrapper is the fullscreen element if set via the player.
		// We identify the sizing wrapper here to set the video to full screen.
		this.sizingWrapper = document.querySelector(".sizing-wrapper");
		this.player = this.sizingWrapper?.querySelector(".NFPlayer") || null;
		if (this.player) {
			this.showNextEpisode(
				this.player.classList.contains("nextEpisodeSeamless"),
			);
		}
		this.observePlayerState();
		this.observeSkipIntro();
		this.observeInteractiveChoices();
		this.setActivityTimer();
	}

	onUnload(): void {
		if (this.controlObserver) this.controlObserver.disconnect();
		if (this.skipObserver) this.skipObserver.disconnect();
		if (this.interactiveObserver) this.interactiveObserver.disconnect();
		if (this.inactivityTimer) {
			clearTimeout(this.inactivityTimer);
		}
		BottomBar.container.show();
		super.onUnload();
	}

	isPageReady(): boolean {
		return document.querySelector(".NFPlayer") !== null;
	}

	observePlayerState(): void {
		this.controlObserver = new MutationObserver(
			(mutations: MutationRecord[]) => {
				for (const mutation of mutations) {
					this.hideControls(
						(mutation.target as Element).classList.contains("inactive"),
					);
					this.showNextEpisode(
						(mutation.target as Element).classList.contains(
							"nextEpisodeSeamless",
						),
					);
				}
			},
		);
		if (this.player) {
			this.controlObserver.observe(this.player, {
				attributes: true,
				attributeFilter: ["class"],
			});
		}
	}

	observeSkipIntro(): void {
		const controls = this.player?.querySelector(".PlayerControlsNeo__layout");
		if (controls) {
			this.checkForElementWithClass(
				controls.childNodes,
				true,
				"skip-credits",
				() => this.showSkipIntro(true),
			);
			this.skipObserver = this.watchForElementsWithClass(
				controls,
				false,
				"skip-credits",
				(found: boolean) => this.showSkipIntro(found),
			);
		}
	}

	observeInteractiveChoices(): void {
		const controls = this.player?.querySelector(
			".PlayerControlsNeo__all-controls",
		);
		if (controls) {
			this.interactiveObserver = new MutationObserver(
				(mutations: MutationRecord[]) => {
					for (const mutation of mutations) {
						this.checkForElementMatchingSelector(
							mutation.addedNodes,
							true,
							".BranchingInteractiveScene--wrapper",
							() => this.setInteractiveMode(true),
						);
						this.checkForElementMatchingSelector(
							mutation.removedNodes,
							false,
							".BranchingInteractiveScene--wrapper",
							() => this.setInteractiveMode(false),
						);
						this.checkForElementMatchingSelector(
							mutation.addedNodes,
							true,
							".SeamlessControls--container",
							() => this.setPostPlay(true),
						);
						this.checkForElementMatchingSelector(
							mutation.removedNodes,
							false,
							".SeamlessControls--container",
							() => this.setPostPlay(false),
						);
					}
				},
			);
			this.interactiveObserver.observe(controls, { childList: true });
		}
	}

	watchForElementsWithClass(
		node: Element,
		subtree: boolean,
		className: string,
		callback: (found: boolean) => void,
	): MutationObserver {
		const observer = new MutationObserver((mutations: MutationRecord[]) => {
			for (const mutation of mutations) {
				this.checkForElementWithClass(
					mutation.addedNodes,
					true,
					className,
					callback,
				);
				this.checkForElementWithClass(
					mutation.removedNodes,
					false,
					className,
					callback,
				);
			}
		});
		observer.observe(node, { childList: true, subtree });
		return observer;
	}

	checkForElementWithClass(
		nodeList: NodeList,
		isAddedList: boolean,
		className: string,
		callback: (added: boolean) => void,
	): void {
		for (const node of Array.from(nodeList)) {
			if (
				node.nodeType === 1 &&
				(node as Element).classList.contains(className)
			) {
				callback(isAddedList);
				return;
			}
		}
	}

	checkForElementMatchingSelector(
		nodeList: NodeList,
		isAddedList: boolean,
		selector: string,
		callback: (added: boolean) => void,
	): void {
		for (const node of Array.from(nodeList)) {
			if (node.nodeType === 1 && (node as Element).querySelector(selector)) {
				callback(isAddedList);
				return;
			}
		}
	}

	showSkipIntro(canSkip: boolean): void {
		this.hasSkipIntro = canSkip;
		if (canSkip) {
			this.actionHandler.addAction(this.skipIntroAction);
		} else {
			this.actionHandler.removeAction(this.skipIntroAction);
		}
	}

	setPostPlay(postplay: boolean): void {
		if (postplay) {
			this.actionHandler.removeAll(this.getActions());
			// this.actionHandler.addAction(this.previousEpisodeAction);
			this.actionHandler.addAction(this.nextEpisodeAction);
			this.actionHandler.addAction(this.backAction);
			this.setActivityTimer();
			this.postplay = true;
		} else {
			this.postplay = false;
			// this.actionHandler.removeAction(this.previousEpisodeAction);
			this.actionHandler.removeAction(this.nextEpisodeAction);
			this.actionHandler.removeAction(this.backAction);
			this.actionHandler.addAll(this.getActions());
		}
	}

	setInteractiveMode(interactive: boolean): void {
		if (interactive) {
			this.actionHandler.removeAll(this.getActions());
			this.addNavigatable(
				0,
				new InteractiveChoices(this.dispatchKey.bind(this)),
			);
			this.setNavigatable(0);
			this.setActivityTimer();
			this.hasInteractiveChoices = true;
		} else {
			this.hasInteractiveChoices = false;
			this.actionHandler.addAll(this.getActions());
			this.removeNavigatable(0);
		}
	}

	hideControls(inactive: boolean): void {
		if (inactive) {
			BottomBar.container.hide();
		} else {
			BottomBar.container.show();
		}
	}

	// showPreviousEpisode(visible) {
	//     this.hasPreviousEpisode = visible;
	//     if (visible) {
	//         this.actionHandler.addAction(this.previousEpisodeAction);
	//     } else {
	//         this.actionHandler.removeAction(this.previousEpisodeAction);
	//     }
	// }

	showNextEpisode(visible: boolean): void {
		this.hasNextEpisode = visible;
		if (visible) {
			this.actionHandler.addAction(this.nextEpisodeAction);
		} else {
			this.actionHandler.removeAction(this.nextEpisodeAction);
		}
	}

	setActivityTimer() {
		if (this.inactivityTimer) {
			clearTimeout(this.inactivityTimer);
		}
		this.hideControls(false);
		this.inactivityTimer = window.setTimeout(() => {
			if (this.hasInteractiveChoices) {
				// keep the controls visible while choices are present
				this.setActivityTimer();
			} else {
				this.hideControls(true);
				this.inactivityTimer = null;
			}
		}, 5000);
	}

	onInput() {
		this.setActivityTimer();
	}

	getActions() {
		if (this.hasInteractiveChoices) {
			return [];
		}
		const actions = this.getDefaultActions();
		// if (this.hasPreviousEpisode) {
		//     actions.push(this.previousEpisodeAction);
		// }
		if (this.hasNextEpisode) {
			actions.push(this.nextEpisodeAction);
		}
		if (this.hasSkipIntro) {
			actions.push(this.skipIntroAction);
		}
		return actions;
	}

	getDefaultActions() {
		return [
			{
				label: "Play",
				index: GAMEPAD_BUTTONS.BUTTON_BOTTOM,
				onPress: () => this.dispatchKey(32),
			},
			{
				label: "Mute",
				index: GAMEPAD_BUTTONS.BUTTON_LEFT,
				onPress: () => this.dispatchKey(77),
			},
			{
				label: "Fullscreen",
				index: GAMEPAD_BUTTONS.BUTTON_TOP,
				onPress: () => this.toggleFullscreen(),
			},
			this.backAction,
			{
				label: "Jump Back 10s",
				index: GAMEPAD_BUTTONS.D_PAD_LEFT,
				onPress: () => this.dispatchKey(37),
			},
			{
				label: "Jump 10s",
				index: GAMEPAD_BUTTONS.D_PAD_RIGHT,
				onPress: () => this.dispatchKey(39),
			},
			{
				label: "Volume Up",
				index: GAMEPAD_BUTTONS.D_PAD_UP,
				onPress: () => this.dispatchKey(38),
			},
			{
				label: "Volume Down",
				index: GAMEPAD_BUTTONS.D_PAD_BOTTOM,
				onPress: () => this.dispatchKey(40),
			},
		];
	}

	onDirectionAction(direction: number): void {
		// override default direction navigation to do nothing unless interactive
		if (this.hasInteractiveChoices) {
			super.onDirectionAction(direction);
		}
	}

	setNavigatable(position: number): void {
		if (position === 0) {
			super.setNavigatable(position);
		}
	}

	// openPreviousEpisode() {
	//     this.clickControl('.button-nfplayerEpisodes', 'nfp-episode-expander [data-uia-is-expanded="true"]');
	// }

	openNextEpisode() {
		this.clickControl(
			".button-nfplayerNextEpisode",
			'button[data-uia="next-episode-seamless-button"]',
		);
		//below only works once player is "ended" class
		//control.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
	}

	skipIntro() {
		this.clickControl(".skip-credits > a");
	}

	goBack() {
		this.clickControl(".button-nfplayerBack", ".BackToBrowse");
	}

	clickControl(playerSelector: string, postplaySelector?: string): void {
		let control = null;
		if (this.postplay && postplaySelector) {
			control = document.querySelector(postplaySelector);
		} else if (this.player) {
			control = this.player.querySelector(playerSelector);
		}
		if (control) {
			(control as HTMLElement).click();
		}
	}

	dispatchKey(keyCode: number, isKeyDown: boolean = true): void {
		const event = new KeyboardEvent(isKeyDown ? "keydown" : "keyup", {
			key: String.fromCharCode(keyCode),
			keyCode: keyCode,
			bubbles: true,
			cancelable: true,
			view: window,
		});
		if (this.player) {
			this.player.dispatchEvent(event);
		}
	}

	toggleFullscreen(): void {
		// For now, ignore the errors thrown by these functions.
		// We likely want a warning-type temporary error bar eventually.
		if (!document.fullscreenElement && this.sizingWrapper) {
			this.sizingWrapper.requestFullscreen().catch((err) => {
				console.warn(`Unable to switch to fullscreen mode: ${err}`);
			});
		} else {
			document.exitFullscreen().catch((err) => {
				console.warn(`Unable to exit fullscreen mode: ${err}`);
			});
		}
	}
}
