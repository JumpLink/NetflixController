import { TitlePanel } from './title-panel.ts';

export class Billboard extends TitlePanel {
    constructor(row?: number) {
        super(row);
    }

    getPanelComponent(): Element | null {
        const selector = this.row !== undefined ? `#row-${this.row}` : '.billboard-row';
        const billboard = document.querySelector(selector);
        return billboard;
    }

    getButtonSelector(): string {
        return '.billboard-links';
    }
}