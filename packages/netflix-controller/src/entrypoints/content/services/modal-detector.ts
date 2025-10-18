import { ModalContainer } from "../components/modal-container.ts";

type ModalCallback = (isOpen: boolean, modalId: string | null) => void;
type PageState = {
	path: string;
	position: number;
	navigatableType: string;
};

/**
 * Netflix Modal Detection and Management Service
 *
 * Singleton service that detects, tracks, and manages Netflix detail modals
 * across different pages. Handles modal lifecycle events and coordinates
 * between page navigation and modal navigation.
 *
 * Netflix UI Target: All Netflix detail modals that appear when selecting
 * movies/TV shows, including:
 * - Movie detail modals
 * - TV show detail modals with episode lists
 * - Content information and action dialogs
 *
 * Core Features:
 * - Modal open/close detection via URL and DOM changes
 * - Page state preservation during modal interactions
 * - Modal container lifecycle management
 * - Event callback system for modal state changes
 * - Integration with Netflix's modal URL parameter system (jbv=modalId)
 *
 * Technical Implementation:
 * - MutationObserver for DOM-based modal detection
 * - URL parameter monitoring for modal state
 * - Singleton pattern for consistent state across pages
 * - Debounced event handling for performance
 */
export class ModalDetector {
	private static instance: ModalDetector;
	private isModalOpen: boolean = false;
	private modalId: string | null = null;
	private urlCheckInterval: number | null = null;
	private domObserver: MutationObserver | null = null;
	private callbacks: Set<ModalCallback> = new Set();
	private modalContainer: ModalContainer | null = null;
	private savedPageState: PageState | null = null;
	private debugMode: boolean = true;

	/**
	 * Get singleton instance
	 */
	public static getInstance(): ModalDetector {
		if (!ModalDetector.instance) {
			ModalDetector.instance = new ModalDetector();
		}
		return ModalDetector.instance;
	}

	/**
	 * Private constructor to enforce singleton pattern
	 */
	private constructor() {
		// Initialize detection
		this.startDetection();
	}

	/**
	 * Start modal detection
	 */
	private startDetection(): void {
		// URL parameter monitoring
		this.urlCheckInterval = window.setInterval(() => {
			this.checkUrlForModal();
		}, 200);

		// DOM mutation monitoring
		this.setupMutationObserver();

		this.logDebug("Modal detection started");
	}

	/**
	 * Check URL for modal parameter
	 */
	private checkUrlForModal(): void {
		const urlParams = new URLSearchParams(window.location.search);
		const modalId = urlParams.get("jbv");

		if (modalId && !this.isModalOpen) {
			this.logDebug(`Modal ID detected in URL: ${modalId}`);
			this.handleModalOpen(modalId);
		} else if (!modalId && this.isModalOpen) {
			this.logDebug("Modal ID removed from URL");
			this.handleModalClose();
		}
	}

	/**
	 * Setup DOM mutation observer for modal detection
	 */
	private setupMutationObserver(): void {
		this.domObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "childList") {
					// Check for modal added to DOM
					for (const node of mutation.addedNodes) {
						if (node.nodeType === Node.ELEMENT_NODE) {
							const element = node as Element;
							// Check if this is a modal element
							if (
								element.matches(
									'div[role="dialog"][data-uia="modal-motion-container-DETAIL_MODAL"]',
								) ||
								element.querySelector(
									'div[role="dialog"][data-uia="modal-motion-container-DETAIL_MODAL"]',
								)
							) {
								// Extract modal ID from URL if we haven't detected it yet
								if (!this.isModalOpen) {
									const urlParams = new URLSearchParams(window.location.search);
									const modalId = urlParams.get("jbv");
									if (modalId) {
										this.logDebug(
											`Modal element detected in DOM, ID: ${modalId}`,
										);
										this.handleModalOpen(modalId);
									}
								}
							}
						}
					}

					// Check for modal removed from DOM
					if (this.isModalOpen) {
						const modalExists = !!document.querySelector(
							'div[role="dialog"][data-uia="modal-motion-container-DETAIL_MODAL"]',
						);
						if (!modalExists) {
							this.logDebug("Modal element removed from DOM");
							this.handleModalClose();
						}
					}
				}
			}
		});

		// Start observing document body for modal changes
		this.domObserver.observe(document.body, {
			childList: true,
			subtree: true,
		});

		this.logDebug("DOM mutation observer set up");
	}

	/**
	 * Handle modal open event
	 */
	private handleModalOpen(modalId: string): void {
		if (this.isModalOpen) {
			this.logDebug("Modal already open, ignoring open event");
			return;
		}

		this.isModalOpen = true;
		this.modalId = modalId;
		this.logDebug(`Modal opening with ID: ${modalId}`);

		// Wait for modal content to be fully loaded before creating the container
		setTimeout(() => {
			// Double check modal is still open
			if (!this.isModalOpen) {
				this.logDebug(
					"Modal no longer open after delay, aborting container creation",
				);
				return;
			}

			// Check if the modal is in the DOM
			const modalElement = document.querySelector(
				'div[role="dialog"][data-uia="modal-motion-container-DETAIL_MODAL"]',
			);

			if (!modalElement) {
				this.logDebug("Modal element not found in DOM after delay");
				return;
			}

			this.logDebug("Creating modal container");
			// Create modal container
			this.modalContainer = new ModalContainer();

			// Notify callbacks
			this.notifyCallbacks();
		}, 500); // Increase delay to ensure content is fully loaded
	}

	/**
	 * Handle modal close event
	 */
	private handleModalClose(): void {
		if (!this.isModalOpen) {
			this.logDebug("Modal already closed, ignoring close event");
			return;
		}

		this.logDebug("Modal closing");

		// Cleanup modal container
		if (this.modalContainer) {
			this.logDebug("Cleaning up modal container");
			this.modalContainer.cleanup();
			this.modalContainer = null;
		}

		this.isModalOpen = false;
		this.modalId = null;

		// Notify callbacks
		this.notifyCallbacks();
	}

	/**
	 * Notify all registered callbacks
	 */
	private notifyCallbacks(): void {
		this.logDebug(
			`Notifying ${this.callbacks.size} callbacks of modal state change: ${this.isModalOpen}`,
		);
		for (const callback of this.callbacks) {
			callback(this.isModalOpen, this.modalId);
		}
	}

	/**
	 * Register a callback for modal state changes
	 */
	public onModalStateChange(callback: ModalCallback): void {
		this.callbacks.add(callback);
		this.logDebug("Callback registered for modal state changes");
		// Immediately notify of current state
		callback(this.isModalOpen, this.modalId);
	}

	/**
	 * Remove a registered callback
	 */
	public removeCallback(callback: ModalCallback): void {
		this.callbacks.delete(callback);
		this.logDebug("Callback removed");
	}

	/**
	 * Check if modal is currently open
	 */
	public isOpen(): boolean {
		return this.isModalOpen;
	}

	/**
	 * Get current modal ID
	 */
	public getCurrentModalId(): string | null {
		return this.modalId;
	}

	/**
	 * Get modal container component
	 */
	public getModalContainer(): ModalContainer | null {
		return this.modalContainer;
	}

	/**
	 * Save the page state before opening modal
	 */
	public savePageState(
		path: string,
		position: number,
		navigatableType: string,
	): void {
		this.savedPageState = { path, position, navigatableType };
		this.logDebug(
			`Saved page state: path=${path}, position=${position}, type=${navigatableType}`,
		);
	}

	/**
	 * Get the saved page state
	 */
	public getSavedPageState(): PageState | null {
		return this.savedPageState;
	}

	/**
	 * Clear the saved page state
	 */
	public clearSavedPageState(): void {
		this.savedPageState = null;
		this.logDebug("Cleared saved page state");
	}

	/**
	 * Stop detection and clean up resources
	 */
	public cleanup(): void {
		this.logDebug("Cleaning up modal detector resources");

		if (this.urlCheckInterval !== null) {
			window.clearInterval(this.urlCheckInterval);
			this.urlCheckInterval = null;
		}

		if (this.domObserver) {
			this.domObserver.disconnect();
			this.domObserver = null;
		}

		if (this.modalContainer) {
			this.modalContainer.cleanup();
			this.modalContainer = null;
		}

		this.callbacks.clear();
		this.isModalOpen = false;
		this.modalId = null;
		this.savedPageState = null;
	}

	/**
	 * Log debug messages if debug mode is enabled
	 */
	private logDebug(message: string): void {
		if (this.debugMode) {
			console.log(`[ModalDetector] ${message}`);
		}
	}
}
