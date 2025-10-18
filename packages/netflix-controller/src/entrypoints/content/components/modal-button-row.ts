import type {
	EnterParams,
	ExitResult,
	InteractiveComponent,
	NavigatableComponent,
	StyleableComponent,
} from "../../../types/components";
import { StaticNavigatable } from "./static-navigatable.ts";

/**
 * Netflix Modal Action Button Row Component
 *
 * Handles navigation for the horizontal row of action buttons in Netflix detail modals.
 * These buttons include Play, Add to List, Like/Unlike, and other content actions.
 *
 * Netflix UI Target: The horizontal row of action buttons that appears at the top
 * of detail modals, typically including:
 * - Play button (primary action)
 * - Add to List / Remove from List
 * - Like/Unlike button (thumbs up/down)
 * - Share button
 * - Download button (when available)
 *
 * Features:
 * - Horizontal navigation between action buttons
 * - Like dropdown menu support (thumbs up/down options)
 * - Button state management (enabled/disabled)
 * - Integration with Netflix's modal button styling
 */
export class ModalButtonRow extends StaticNavigatable {
	private modal: HTMLElement;
	private likeDropdownOpen: boolean = false;
	private likeDropdownItems: HTMLElement[] = [];

	constructor(modal: HTMLElement) {
		super();
		this.modal = modal;
	}

	/**
	 * Get all interactive buttons
	 */
	getComponents(): NavigatableComponent[] {
		// If like dropdown is open, return dropdown items
		if (this.likeDropdownOpen) {
			return this.getLikeDropdownItems();
		}

		// Otherwise return main buttons
		const components: NavigatableComponent[] = [];

		// Play button
		const playButton = this.modal.querySelector(
			'.primary-button.playLink[data-uia="play-button"]',
		) as NavigatableComponent;
		if (playButton) components.push(playButton);

		// Add to list button
		const addButton = this.modal.querySelector(
			'button[data-uia="add-to-my-list"]',
		) as NavigatableComponent;
		if (addButton) components.push(addButton);

		// Like button
		const likeButton = this.modal.querySelector(
			'button[data-uia="thumbs-rate-button"]',
		) as NavigatableComponent;
		if (likeButton) components.push(likeButton);

		return components;
	}

	/**
	 * Get like dropdown menu items when the dropdown is open
	 */
	private getLikeDropdownItems(): NavigatableComponent[] {
		// Cache the result so we don't have to query the DOM repeatedly
		if (this.likeDropdownItems.length === 0) {
			// Look for the dropdown menu items
			const dropdownItems = this.modal.querySelectorAll(
				'[aria-haspopup="menu"] + div > div > button',
			) as NodeListOf<HTMLElement>;

			if (dropdownItems && dropdownItems.length > 0) {
				this.likeDropdownItems = Array.from(dropdownItems);
			}
		}

		return this.likeDropdownItems as NavigatableComponent[];
	}

	/**
	 * Override interact to handle special cases
	 */
	interact(component: InteractiveComponent | null): void {
		if (!component) {
			const selectedComponent =
				this.getSelectedComponent() as InteractiveComponent;
			if (!selectedComponent) return;
			component = selectedComponent;
		}

		// Check if the component is a like button
		if (
			component.getAttribute("data-uia") === "thumbs-rate-button" &&
			!this.likeDropdownOpen
		) {
			// Open the dropdown
			super.interact(component);
			this.likeDropdownOpen = true;

			// Reset components and position for dropdown navigation
			this._components = null;
			this.position = -1;

			// Select first dropdown item
			this.select(0);
			return;
		}

		// For all other cases, use default behavior
		super.interact(component);

		// If we're in the dropdown, close it after selection
		if (this.likeDropdownOpen) {
			this.closeDropdown();
		}
	}

	/**
	 * Close the like dropdown
	 */
	private closeDropdown(): void {
		this.likeDropdownOpen = false;
		this.likeDropdownItems = [];
		this._components = null;

		// Wait a bit for the dropdown to close before refreshing
		setTimeout(() => {
			// Reset position to like button (typically position 2)
			this.select(Math.min(2, this.getComponents().length - 1));
		}, 100);
	}

	/**
	 * Style the selected component
	 */
	style(component: StyleableComponent | null, selected: boolean): void {
		if (!component) return;

		if (this.styler) {
			this.styler.toggleStyle(component, ":hover", selected);

			// Add outline
			if (selected) {
				component.style.outline = "3px solid rgba(229, 9, 20, 0.7)";
			} else {
				component.style.outline = "";
			}
		}
	}

	/**
	 * Initialize the component
	 */
	enter(_params?: EnterParams): void {
		this.likeDropdownOpen = false;
		this.likeDropdownItems = [];
		this._components = null;

		// Select first component
		this.select(0);
	}

	/**
	 * Clean up when exiting
	 */
	exit(): ExitResult {
		this.unselect();
		this.likeDropdownOpen = false;
		this.likeDropdownItems = [];
		this.position = -1;
		return {};
	}
}
