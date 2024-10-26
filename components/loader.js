export default class LoadingSpinner {
    static DEFAULT_SPLIT = String.raw``;
    static DEFAULT_FRAMES = String.raw`/-\|`.split(LoadingSpinner.DEFAULT_SPLIT);
    static DEFAULT_DELAY_MS = 256;

    #split = LoadingSpinner.DEFAULT_SPLIT;
    #frames = LoadingSpinner.DEFAULT_FRAMES;
    #delay = LoadingSpinner.DEFAULT_DELAY_MS;

    #frame = 0;
    #intervalId = null;

    constructor(target) {
        this.target = target;
        this.applySettings();
    }

    applySettings() {
        const style = window.getComputedStyle(this.target);

        this.#split = style.getPropertyValue("--split").length > 0
            ? style.getPropertyValue("--split").slice(1, -1)
            : LoadingSpinner.DEFAULT_SPLIT;

        this.#frames = style.getPropertyValue("--frames").length > 0
            ? style.getPropertyValue("--frames").slice(1, -1).split(this.#split)
            : LoadingSpinner.DEFAULT_FRAMES;

        this.#delay = !!Number(style.getPropertyValue("--delayms"))
            ? Number(style.getPropertyValue("--delayms"))
            : LoadingSpinner.DEFAULT_DELAY_MS;
    }

    #render() {
        if (this.#frame >= this.#frames.length)
            this.#frame = 0;
        this.target.textContent = this.#frames.at(this.#frame++);
    }

    show() {
        this.#render();
        this.#intervalId = setInterval(() => this.#render(), this.#delay);
    }

    hide() {
        this.#intervalId = clearInterval(this.#intervalId);
        this.target.textContent = String();
    }

    async showWhile(fn) {
        this.show();
        try {
            await fn();
        } catch(err) {
            this.hide();
            throw err;
        } finally {
            this.hide();
        }
    }
}
