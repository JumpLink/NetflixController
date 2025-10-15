import { StaticNavigatable } from './static-navigatable.ts';

declare function runHandler(path: string, forceLoad: boolean): void;

export class Profiles extends StaticNavigatable {
    getComponents(): any[] {
        return Array.from(document.querySelectorAll('.choose-profile a.profile-link'));
    }

    style(component: any, selected: boolean): void {
        (this.styler as any).toggleStyle(component, ':hover', selected);
    }

    interact(component: any): void {
        super.interact(component);
        runHandler(window.location.pathname, true);
    }
}