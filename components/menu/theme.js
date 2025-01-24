import { StatePopupMenu, MenuOption } from "./menuItem.js";

const fontFaces = {
    "Cartograph": "/fonts/cartograph/CartographCF-LightItalic.woff2",
    "GT America": "/fonts/gt_america/GT-America-LC-Expanded-Regular.woff2",
    "Cordata": "/fonts/WebPlus_Cordata_PPC-400.woff",
    "ABC Social": "/fonts/abc_social/ABCSocialCyrillicExtended-Regular-Trial.woff2",
    "Lausanne": "/fonts/twk_lausanne/TWKLausanne-300.woff2",
    "Suisse": "/fonts/swiss_suisse/SuisseIntl-Light-WebTrial.woff2",
};

export default new class ThemeMenu extends StatePopupMenu {
    #cache = new Map();

    label = "Themes";
    id = "themes";
    subMenus = [
        new MenuOption("Zensur", "zensur"),
        new MenuOption("Alpha", "alpha"),
        new MenuOption("Terminal", "terminal"),
    ];

    constructor(...args) {
        super(...args);

        this.link = document.createElement("link");
        this.link.rel = "stylesheet";
        document.head.append(this.link);

        this.preloadLink = document.createElement("link");
        this.preloadLink.rel = "stylesheet";
        document.head.append(this.preloadLink);

        this.loadTheme(this.selected.id);
        this.addEventListener("input", async _ => {
            this.dispatchEvent(new CustomEvent("beforethemechange"));
            this.selected = this.focused;
            await this.loadTheme(this.selected.id);
            this.dispatchEvent(new CustomEvent("themechange"));
        });
    }

    get liveStatus() {
        return this.selected.label;
    }

    get loaded() {
        return this.#cache.get(this.selected.id);
    }

    // FIXME Abort all loads if another theme is set while loading.
    async loadTheme(theme) {
        const loader = new Promise(async loaded => {
            // Load CSS
            await new Promise(res => {
                this.preloadLink.addEventListener("load", res, { once: true })
                this.preloadLink.href = `./css/theme/${theme}.css`
            });

            // Load fonts
            let unloadedFontFamiliesFromCss = new Set();
            let rules = Array.from(this.preloadLink.sheet.rules);
            while (rules.length) {
                const rule = rules.shift();
                rules.push(...rule.cssRules);

                let family = rule.style.fontFamily;
                if (family.length === 0) continue;

                family = family.replace(/^"|"$/g, "");
                const familyIsLoaded = [...document.fonts.values()].find(font => font.family === family);
                if (familyIsLoaded) continue;

                unloadedFontFamiliesFromCss.add(family);
            }

            if (unloadedFontFamiliesFromCss.size > 0)
                for (const family of unloadedFontFamiliesFromCss.keys())
                    document.fonts.add(new FontFace(family, `url(${fontFaces[family]})`));

            await Promise.all([...document.fonts.values()].map(fontface => fontface.load()));

            // Set theme
            document.documentElement.dataset.theme = theme;
            this.link.href = this.preloadLink.href;
            this.preloadLink.href = String();

            loaded();
        })

        this.#cache.set(theme, loader);

        return loader;
    }
};
