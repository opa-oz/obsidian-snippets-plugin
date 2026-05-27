import { getIcon } from "obsidian";

const CSS_CLASSES = {
    callout: 'callout',
    calloutTitle: 'callout-title',
    calloutTitleInner: 'callout-title-inner',
    calloutContent: 'callout-content',
    calloutIcon: 'callout-icon',
};

export interface CalloutOptions {
    title?: string;
    type: 'warning' | 'tip' | 'fail' | 'success';
    text?: string[];
}

function decideIcon(type: string): string {
    switch (type) {
        case 'warning':
            return 'alert-triangle'
        case `tip`:
            return 'flame'
        case `fail`:
            return 'x'
        case `success`:
            return 'check'
        default:
            return 'info'
    }
}

export function callout(containerEl: HTMLElement, opts: CalloutOptions): HTMLElement {
    const element = containerEl.createDiv({ cls: CSS_CLASSES.callout, attr: { 'data-callout': opts.type } });

    if (opts.title) {
        const title = element.createDiv({ cls: CSS_CLASSES.calloutTitle });
        const icon = title.createDiv({ cls: CSS_CLASSES.calloutIcon });

        const svg = getIcon(decideIcon(opts.type));
        if (svg) {
            icon.append(svg);
        }

        title.createDiv({ cls: CSS_CLASSES.calloutTitleInner, text: opts.title });
    }

    if (opts.text && opts.text.length > 0) {
        const content = element.createDiv({ cls: CSS_CLASSES.calloutContent });

        for (let p of opts.text) {
            content.createEl("p", { text: p });
        }
    }

    return element;
}
