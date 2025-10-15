import { TitlePanel } from './title-panel.ts';

declare let currentHandler: any;

export class Jawbone extends TitlePanel {
    jawbone: any;
    inline: boolean;
    slider: any;
    closed: boolean;
    replacedEarlierJawbone: boolean;
    tabPosition?: number;
    tabs?: any[];
    sliderPosition?: number;

    constructor(row: number, jawbone?: any, slider?: any) {
        super(row);
        this.jawbone = jawbone;
        this.inline = jawbone !== undefined;
        this.slider = slider;
        this.closed = false;
        this.replacedEarlierJawbone = false;

        if (this.slider) {
            this.slider.jawboneOpen = true;
        }

        if (this.inline) {
            this.replaceInlineJawbone();
        }

        // TODO implement support for Jawbone menu navigation
        // this.initTabs();
        // this.nextTabAction = {
        //     label: 'Next Tab',
        //     index: StandardMapping.Button.BUMPER_RIGHT,
        //     onPress: () => this.selectTab(false)
        // };
        // this.prevTabAction = {
        //     label: 'Previous Tab',
        //     index: StandardMapping.Button.BUMPER_LEFT,
        //     onPress: () => this.selectTab(true)
        // }
    }

    static getJawbone(row: number, slider?: any): Jawbone | null {
        let rowNode = document.getElementById(`row-${row}`);
        if (rowNode) {
            let jawbone = rowNode.querySelector('.jawBoneContainer');
            if (jawbone) {
                return new Jawbone(row, jawbone, slider);
            }
        }
        return null;
    }

    initTabs(): void {
        this.tabPosition = -1;
        const panel = this.getPanelComponent();
        if (panel) {
            this.tabs = panel.querySelectorAll('.menu > li');
            if (this.tabs) {
                for (let i = 0; i < this.tabs.length; i++) {
                    if (this.tabs[i].classList.contains('current')) {
                        this.tabPosition = i;
                        return;
                    }
                }
            }
        }
    }

    replaceInlineJawbone(): void {
        if (currentHandler && currentHandler.inlineJawbone) {
            currentHandler.removeNavigatable(currentHandler.inlineJawbone);
            if (this.row !== currentHandler.inlineJawbone.row) {
                currentHandler.inlineJawbone.slider!.jawboneOpen = false;
                // used to update position properly when setting position in SliderBrowse
                this.replacedEarlierJawbone = this.row! > currentHandler.inlineJawbone.row!;
            }
        }
        if (currentHandler) {
            currentHandler.inlineJawbone = this;
        }
    }

    getActions(): any[] {
        let actions = super.getActions();
        if (this.inline) {
            actions.push({
                label: 'Close',
                index: StandardMapping.Button.BUTTON_LEFT,
                onPress: () => this.close()
            });
        }
        // if (this.tabPosition > 0) {
        //     actions.push(this.prevTabAction);
        // }
        // if (this.tabPosition < this.tabs.length - 1) {
        //     actions.push(this.nextTabAction);
        // }
        return actions;
    }

    enter(params: any) {
        if ('position' in params && !('sliderPosition' in this)) {
            // track parent slider position for when jawbone closes
            this.sliderPosition = params.position;
        }
        super.enter(params);
    }

    exit(): any {
        super.exit();
        const params: any = { jawboneRow: this.row };
        if ('sliderPosition' in this) {
            params.position = this.sliderPosition;
        }
        if (this.closed) {
            params.jawboneClosed = true;
        }
        return params;
    }

    close() {
        let button = this.jawbone.querySelector('.close-button');
        if (button) {
            button.click();
            this.closed = true;
            this.slider.jawboneOpen = false;
            currentHandler.removeCurrentNavigatable();
        }
    }

    // selectTab(left) {
    //     let newPosition = this.tabPosition + (left ? 1 : -1);
    //     this.tabs[newPosition].click();
    // }

    getPanelComponent() {
        if (!this.jawbone) {
            // the title jawbone should be the first and only jawbone in the page
            this.jawbone = document.querySelector('.jawBoneContainer');
        }
        return this.jawbone;
    }

    getButtonSelector() {
        return '.jawbone-actions';
    }
}