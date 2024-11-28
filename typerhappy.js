import Menu from "./components/menu.js"
import Themes from "./components/menu/theme.js"
import Actions from "./components/menu/actions.js"
import SourceMenu from "./components/menu/source.js"
import Typer from "./components/typer.js"
import LoadingSpinner from "./components/loader.js"
import RelatedSelection from "./components/RelatedSelection.js"
import Shortcuts from "./components/Shortcuts.js"

void new class Typerhappy {
    LoadingSpinner = new LoadingSpinner(LoaderNode);
    sources = new SourceMenu();
    themes = new Themes();
    actions = new Actions();
    shortcuts = new Shortcuts();
    menu = new Menu(MenuNode, { items: [ this.sources, this.themes, this.actions ] });
    typer = new Typer(TyperNode);
    relatedSelection = new RelatedSelection(RelatedSelectionNode);

    constructor() {
        this.addListener();

        const keydownChain = [ this.menu, this.shortcuts, this.typer, this.relatedSelection ];
        document.body.addEventListener("keydown", evt => {
            for (let k of keydownChain)
                if (k.handleKeydown(evt))
                    break;
        });

        // FIXME Hide UI while theme is still loading, but start loading right away.
        this.themes.loaded.then(() => {});

        const predefinedUrlFromHash = location.hash.substring(1);
        if (URL.canParse(predefinedUrlFromHash)) {
            this.LoadingSpinner.showWhile(async () => {
                const item = await this.sources.maybeLoadUrl(predefinedUrlFromHash);
                if (item === false) {
                    const random_item = await this.sources.activeItem.random();
                    this.current_item = random_item;
                    this.typer.set_text(this.current_item.textSanitized);
                } else {
                    this.current_item = item;
                    this.typer.set_text(this.current_item.textSanitized);
                }
            });
        } else {
            this.loadRandomItem();
        }
    }

    addListener() {
        this.themes.addEventListener("changestart", () => {
            // FIXME Add fn to typer to handle hide/show.
            this.typer.node.style.display = "none";
            this.LoadingSpinner.show();
        });

        this.themes.addEventListener("change", () => {
            this.typer.node.style.removeProperty("display");
            this.LoadingSpinner.hide();

            this.LoadingSpinner.applySettings();
            this.typer.handleStyleChange();
        });

        this.menu.addEventListener("settingChanged", e => {
            const { key, value } = e.detail;

            switch (key) {
            case "actions":
                switch (value) {
                case "skip_segment":
                    return this.typer.skipSegment();
                case "skip_item":
                    return this.typer.forceFinish();
                }
            }
        });
        this.menu.addEventListener("deferredSettingChanged", e => {
            const { key } = e.detail;

            switch (key) {
            case "source":
                this.typer.clear();
                this.loadRandomItem();
                break;
            }
        });

        this.typer.addEventListener("filter", e => {
            switch (e.detail.filter) {
            case "tokenize":
                e.detail.fn.tokenize = (text, locales) => text.split(/\s+/).flatMap((t, i, arr) => {
                    return arr.length - 1 === i ? t : [t, "\x20"]
                });
                break;
            }
        });
        this.typer.addEventListener("done", () => this.handleNext());

        this.relatedSelection.addEventListener("selected", e => {
            const id = e.detail.selectedId;
            this.handleRelatedSelection(id);
        });

        this.shortcuts.addEventListener("skipSegment", () => this.typer.skipSegment());
        this.shortcuts.addEventListener("skipItem", () => this.typer.forceFinish());
    }

    async loadRandomItem() {
        this.LoadingSpinner
            .showWhile(async () => this.current_item = await this.sources.activeItem.random())
            .then(() => this.typer.set_text(this.current_item.textSanitized));
    }

    async handleRelatedSelection(id) {
        this.LoadingSpinner
            .showWhile(async () => this.current_item = await this.sources.activeItem.fetch({ id }))
            .then(() => this.typer.set_text(this.current_item.textSanitized));
    }

    async handleNext() {
        this.LoadingSpinner.showWhile(async () => {
            const options = this.options = await this.sources.activeItem.getRelated(this.current_item);
            this.relatedSelection.set_options(options);
        });
    }
}
