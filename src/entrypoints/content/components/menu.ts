import { StaticNavigatable } from './static-navigatable.ts';

declare function getTransparentNetflixRed(opacity: number): string;

export class Menu extends StaticNavigatable {
    getComponents(): any[] {
        return Array.from(document.querySelectorAll('li.navigation-tab a'));
    }

    style(component: any, selected: boolean): void {
        (this.styler as any).toggleStyle(component, ':hover', selected);
        if (selected) {
            component.style.cssText = 'outline: 3px solid ' + getTransparentNetflixRed(0.7) + ' !important';
        } else {
            component.style.outline = '0';
        }
    }
}
