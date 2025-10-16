import { Profiles } from "../components/profiles.js";
import { NavigatablePage } from "./page.ts";

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
