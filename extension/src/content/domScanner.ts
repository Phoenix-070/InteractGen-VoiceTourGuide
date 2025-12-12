
export interface SimplifiedElement {
    tagName: string;
    text: string;
    id: string;
    className: string;
    selector: string;
}

export const scanPage = (): SimplifiedElement[] => {
    // We want to capture semantically important elements
    const relevantTags = ['H1', 'H2', 'H3', 'P', 'BUTTON', 'A', 'IMG', 'LI', 'TABLE'];

    // Helper to generate a unique selector (simplified)
    const getSelector = (el: Element): string => {
        if (el.id) return `#${el.id}`;
        let selector = el.tagName.toLowerCase();
        if (el.className) {
            const classes = Array.from(el.classList).join('.');
            // simple class selector
            selector += `.${classes.split(' ')[0]}`;
        }
        return selector;
    }

    const elements: SimplifiedElement[] = [];

    // Walk the DOM or just select? selecting might be easier
    const nodes = document.querySelectorAll(relevantTags.join(','));

    nodes.forEach((node) => {
        const el = node as HTMLElement;
        const text = el.innerText.trim();
        // Skip empty or hidden elements
        if (!text && node.tagName !== 'IMG') return;
        if (el.offsetParent === null) return; // Hidden

        elements.push({
            tagName: el.tagName,
            text: text.substring(0, 200), // Truncate long text
            id: el.id,
            className: el.className,
            selector: getSelector(el)
        });
    });

    return elements.slice(0, 50); // Limit to top 50 elements to save tokens for MVP
};
