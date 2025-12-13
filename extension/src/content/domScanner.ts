
export interface SimplifiedElement {
    tagName: string;
    text: string;
    id: string;
    className: string;
    selector: string;
}

export const scanPage = (): SimplifiedElement[] => {
    // We want to capture semantically important elements
    const relevantTags = ['H1', 'H2', 'H3', 'P', 'BUTTON', 'A', 'IMG', 'LI', 'TABLE', 'ARTICLE', 'SECTION'];

    // Helper to generate a unique selector using nth-of-type for robustness
    const getSelector = (el: Element): string => {
        if (el.id) return `#${el.id}`;

        let path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += `#${el.id}`;
                path.unshift(selector);
                break;
            } else {
                let sib = el, nth = 1;
                while (sib.previousElementSibling) {
                    sib = sib.previousElementSibling;
                    if (sib.nodeName.toLowerCase() === selector)
                        nth++;
                }
                if (nth != 1)
                    selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            el = el.parentNode as Element;
        }
        return path.join(" > ");
    }

    const elements: SimplifiedElement[] = [];

    // Select all relevant tags
    const nodes = document.querySelectorAll(relevantTags.join(','));

    nodes.forEach((node) => {
        const el = node as HTMLElement;
        const text = el.innerText.trim();

        // Filter out empty or very short elements (noise), unless it's an image
        if (node.tagName !== 'IMG' && text.length < 15) return;

        // Skip hidden elements
        if (el.offsetParent === null) return;

        elements.push({
            tagName: el.tagName,
            text: text.substring(0, 300), // Slightly larger context
            id: el.id,
            className: el.className,
            selector: getSelector(el)
        });
    });

    return elements.slice(0, 500); // Increased limit significantly
};
