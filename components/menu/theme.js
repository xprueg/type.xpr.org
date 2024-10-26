import MenuItem from "./menuItem.js";

const fontFaces = {
    "Cartograph": "/fonts/cartograph/CartographCF-LightItalic.woff2",
    "GT America": "/fonts/gt_america/GT-America-LC-Expanded-Regular.woff2",
    "Cordata": "/fonts/WebPlus_Cordata_PPC-400.woff",
};

export default class ThemeMenu extends MenuItem {
    name = "Theme";
    key = "theme";

    items = [
        { key: "alpha", name: "Alpha" },
        { key: "zensur", name: "Zensur" },
        { key: "terminal", name: "Terminal" },
    ];

    cache = new Map();

    constructor() {
        super();

        this.link = document.createElement("link");
        this.link.rel = "stylesheet";
        document.head.append(this.link);

        this.preloadLink = document.createElement("link");
        this.preloadLink.rel = "stylesheet";
        document.head.append(this.preloadLink);

        this.setTheme(this.activeItem.key);
    }

    get loaded() {
        return this.cache.get(this.activeItem.key)
    }

    async onInput(theme) {
        this.dispatchEvent(new Event("changestart"));
        super.onChange(theme);
        await this.setTheme(theme);
        this.dispatchEvent(new Event("change"));
    }

    // FIXME Abort all loads if another theme is set while loading.
    setTheme(theme) {
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

        this.cache.set(theme, loader);

        return loader;
    }
}
