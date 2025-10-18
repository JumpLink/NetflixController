import type {
	EnterParams,
	ExitResult,
	InteractiveComponent,
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components";
import { StaticNavigatable } from "./static-navigatable.ts";

/**
 * Handles navigation for the episode list in the detail modal
 */
export class ModalEpisodeList extends StaticNavigatable {
	private modal: HTMLElement;
	private episodeSelector: HTMLElement | null = null;

	constructor(modal: HTMLElement) {
		super();
		this.modal = modal;
		this.episodeSelector = this.modal.querySelector(
			".episodeSelector-container",
		) as HTMLElement;
	}

	/**
	 * Get all episode items as navigatable components
	 */
	getComponents(): NavigatableComponent[] {
		if (!this.episodeSelector) return [];

		const episodeItems = this.episodeSelector.querySelectorAll(
			'.titleCardList--container.episode-item[role="button"]',
		) as NodeListOf<HTMLElement>;

		return Array.from(episodeItems);
	}

	/**
	 * Style the selected episode
	 */
	style(component: StyleableComponent | null, selected: boolean): void {
		if (!component) return;

		if (this.styler) {
			this.styler.toggleStyle(component, ":hover", selected);
		}

		// Add outline
		if (selected) {
			component.style.outline = "3px solid rgba(229, 9, 20, 0.7)";
		} else {
			component.style.outline = "";
		}
	}

	/**
	 * Handle interaction with an episode
	 */
	interact(component: InteractiveComponent | null): void {
		if (!component) {
			component = this.getSelectedComponent() as InteractiveComponent;
			if (!component) return;
		}

		// Check if the component is still in the DOM
		if (!component.isConnected) {
			console.warn("Attempted to interact with a detached episode component");
			return;
		}

		component.click();
	}

	/**
	 * Handle internal up navigation
	 * Return true if the navigation was handled internally
	 */
	handleInternalUp(): boolean {
		if (this.position > 0) {
			// If not at the top of the list, handle internally
			this.select(this.position - 1);
			return true;
		}
		return false; // Not handled internally
	}

	/**
	 * Handle internal down navigation
	 * Return true if the navigation was handled internally
	 */
	handleInternalDown(): boolean {
		if (this.position < this.components.length - 1) {
			// If not at the bottom of the list, handle internally
			this.select(this.position + 1);
			return true;
		}
		return false; // Not handled internally
	}

	/**
	 * Initialize the component
	 */
	enter(_params?: EnterParams): void {
		// Find the currently playing episode (has .current class)
		const currentEpisode = this.episodeSelector?.querySelector(
			".episode-item.current",
		) as HTMLElement;

		if (currentEpisode) {
			// Find the index of the current episode
			const index = this.components.indexOf(currentEpisode);
			if (index >= 0) {
				this.select(index);
				return;
			}
		}

		// Default to first episode
		this.select(0);
	}

	/**
	 * Clean up when exiting
	 */
	exit(): ExitResult {
		this.unselect();
		this.position = -1;
		return {};
	}

	/**
	 * Override the select method to add scrolling
	 */
	select(position: number): void {
		super.select(position);
		this.scrollSelectedIntoView();
	}

	/**
	 * Scroll the selected episode into view
	 */
	private scrollSelectedIntoView(): void {
		const component = this.getSelectedComponent();
		if (!component || !this.episodeSelector) return;

		// Use native scrollIntoView for consistency with other components
		if (component.getBoundingClientRect) {
			// Calculate if element is partially or fully out of view
			const containerRect = this.episodeSelector.getBoundingClientRect();
			const componentRect = component.getBoundingClientRect();

			// If element is not fully visible in the container
			if (
				componentRect.bottom > containerRect.bottom ||
				componentRect.top < containerRect.top
			) {
				// We need to scroll the component into view within the container
				component.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
				});
			}
		}
	}
}
