import { TitlePanel } from "./title-panel.ts";

export class Billboard extends TitlePanel {
	getPanelComponent(): Element | null {
		const selector =
			this.row !== undefined ? `#row-${this.row}` : ".billboard-row";
		const billboard = document.querySelector(selector);
		return billboard;
	}

	getButtonSelector(): string {
		return ".billboard-links";
	}
}
