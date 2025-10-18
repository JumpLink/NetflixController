import { Profiles } from "../components/profiles.js";
import { NavigatablePage } from "./page.ts";

/**
 * Netflix Profile Selection Page Handler
 *
 * Handles the Netflix profile selection screen where users choose
 * which profile to use for their Netflix session.
 *
 * Netflix UI Target: The "Who's watching?" screen with profile avatars
 * and names that appears after login or when switching profiles.
 */
export class ChooseProfile extends NavigatablePage {
	static validatePath(_path: string): boolean {
		// can occur at any path; check for element
		return document.querySelector(".list-profiles") !== null;
	}

	hasPath(): boolean {
		return false;
	}

	onLoad(): void {
		this.addNavigatable(0, new Profiles());
		this.setNavigatable(0);
	}

	isPageReady(): boolean {
		return document.querySelector(".list-profiles") !== null;
	}

	needsPseudoStyler(): boolean {
		return true;
	}

	setNavigatable(position: number): void {
		if (position === 0) {
			super.setNavigatable(position);
		}
	}
}
