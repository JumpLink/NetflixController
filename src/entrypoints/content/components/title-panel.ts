import { StaticNavigatable } from './static-navigatable.ts';

export class TitlePanel extends StaticNavigatable {
    row?: number;
    primaryButton: Element | null;
    secondaryButton: Element | null;

    constructor(row?: number) {
        super();
        this.row = row;
        this.primaryButton = null;
        this.secondaryButton = null;

        const panel = this.getPanelComponent();
        const baseSelector = this.getButtonSelector();

        if (panel) {
            this.primaryButton = panel.querySelector(baseSelector + ' button.color-primary');
            this.secondaryButton = panel.querySelector(baseSelector + ' button.color-secondary');
        }
    }

    getPanelComponent(): Element | null {
        throw new TypeError('must implement abstract TitlePanel#getPanelComponent');
    }

    getButtonSelector(): string {
        throw new TypeError('must implement abstract TitlePanel#getButtonSelector');
    }

    getComponents(): (Element | null)[] {
        return [this.primaryButton, this.secondaryButton];
    }

    interact(component: any): void {
        if (component === this.secondaryButton) {
            component.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        } else {
            super.interact(component);
        }
    }

    style(component: any, selected: boolean): void {
        (this.styler as any).toggleStyle(component, ':hover', selected);
    }
}