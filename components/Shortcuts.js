export default class Shortcuts extends EventTarget {
    constructor() {
        super();
    }

    handleKeydown(evt) {
        const key = evt.key;
        const ctrl = evt.ctrlKey || evt.metaKey;
        const acceptedKeydown = (() => {
            switch(true) {
            default: return false;
            case ctrl && key === "p":
                this.dispatchEvent(new CustomEvent("skipSegment"));
                return true;
            case ctrl && key === "x":
                this.dispatchEvent(new CustomEvent("skipItem"));
                return true;
            }
        })();

        if (acceptedKeydown)
            evt.preventDefault();
        return acceptedKeydown;
    }
}
