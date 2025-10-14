import { Navigatable } from './navigatable.ts';
import { StandardMapping } from '../../../utils/gamepads.ts';

// Import from content/index.ts - this would normally be a separate utility
declare function getTransparentNetflixRed(opacity: number): string;

export abstract class StaticNavigatable extends Navigatable {
    position: number;
    _components: any[] | null = null;

    constructor() {
        super();
        this.position = -1;
    }

    get components(): any[] {
        if (!this._components) {
            this._components = this.getComponents();
        }
        return this._components;
    }

    abstract getComponents(): any[];

    getSelectedComponent(): any {
        return this.components[this.position];
    }

    // can be overriden for custom style component
    getStyleComponent(): any {
        return this.getSelectedComponent();
    }

    // can be overriden for custom interaction component
    getInteractionComponent(): any {
        return this.getSelectedComponent();
    }

    // can be overriden for custom interaction
    interact(component: any): void {
        component.click();
    }

    // can be overriden for custom styling, such as with pseudo-styler
    style(_component: any, _selected: boolean): void {

    }

    // can be overriden to disable scrolling into view when selected
    shouldScrollIntoView(): boolean {
        return true;
    }

    left(): void {
        if (this.position > 0) {
            this.select(this.position - 1);
        }
    }

    right(): void {
        if (this.position < this.components.length - 1) {
            this.select(this.position + 1);
        }
    }

    enter(_params?: any): void {
        this.select(0);
    }

    exit(): any {
        this.unselect();
        this.position = -1;
    }

    getActions(): any[] {
        return [
            {
                label: 'Select',
                index: StandardMapping.Button.BUTTON_BOTTOM,
                onPress: () => this.interact(this.getInteractionComponent())
            }
        ];
    }

    unselect(): void {
        if (this.position >= 0) {
            let component = this.getStyleComponent();
            this.style(component, false);
            component.style.outline = '0';
        }
    }

    select(position: number): void {
        this.unselect();
        this.position = position;
        let component = this.getStyleComponent();
        this.style(component, true);
        component.style.outline = '3px solid ' + getTransparentNetflixRed(0.7);
        if (this.shouldScrollIntoView()) {
            Navigatable.scrollIntoView(this.getStyleComponent());
        }
    }
}