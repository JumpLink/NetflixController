export abstract class Navigatable {
    styler: any;

    constructor() {
        if (new.target === Navigatable) {
            throw new TypeError('cannot instantiate abstract Navigatable');
        }
    }

    setStyler(styler: any): void {
        this.styler = styler;
    }

    abstract left(): void;

    abstract right(): void;

    abstract enter(params?: any): void;

    abstract exit(): any;

    getActions(): any[] {
        return [];
    }

    static mouseOver(element: Element): void {
        let mouseover = new MouseEvent('mouseover', {bubbles: true});
        element.dispatchEvent(mouseover);
    }

    static mouseOut(element: Element): void {
        let mouseout = new MouseEvent('mouseout', {bubbles: true});
        element.dispatchEvent(mouseout);
    }

    static scrollIntoView(element: Element): void {
        let bounds = element.getBoundingClientRect();
        let y = bounds.top + bounds.height / 2 + window.scrollY - window.innerHeight / 2;
        window.scroll({ top: y, behavior: 'smooth' });
    }
}