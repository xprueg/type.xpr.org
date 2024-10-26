export default class SourceItem {
    #title;
    #text;
    #image;
    #sourceUri;
    #author;

    constructor(item) {
        Object.assign(this, item) 
    }

    get textSanitized() {
        return Array
            .from(new DOMParser().parseFromString(this.text, "text/html").body.childNodes)
            .map(c => c.textContent)
            .join("\x20")
            .replace(/\s+/g, "\x20")
            .trim()
    }
}
