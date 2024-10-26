/* FIXME: Handle faulty resonse: {
    "type": "https://mediawiki.org/wiki/HyperSwitch/errors/not_found#route",
    "title": "Not found.",
} */

import MenuItem from "../menu/menuItem.js";
import SourceItem from "./sourceItem.js"

export default class Wikipedia extends MenuItem {
    name = "Wikipedia";
    key = "wikipedia";

    items =  [
        { key: "de", name: "De" },
        { key: "en", name: "En" },
        { key: "ru", name: "Ru" },
    ];

    toString() {
        return `${this.name} (${this.activeItem.name})`; 
    }

    #relatedCache = new Map();
    // TODO: Cache a new random article after each "random" call.
    #randomCache = new Map();

    #headers = {
        headers: new Headers({
            "Api-User-Agent": "Wikitype (https://xpr.org/wikitype; abuse@xpr.org)",
        }),
    };

    async random(article_url) {
        let url = `https://${this.activeItem.key}.wikipedia.org/api/rest_v1/page/random/summary`;
        if (article_url) {
            url = article_url.replace(
                new RegExp(String.raw`(https://[a-z]{2}.wikipedia.org)/wiki/(.+)`),
                (_, domain, title) => `${domain}/api/rest_v1/page/summary/${title}`
            ); 
        }

        const res = await fetch(url, this.#headers);
        const article = await res.json();

        this.#cacheRelatedArticles(article);

        return new SourceItem({ text: article.extract, ...article });
    }

    #cacheRelatedArticles(article) {
        this.#relatedCache.clear();

        const lang = article.lang;
        const title = encodeURIComponent(article.titles.normalized);

        this.#relatedCache.set(article.pageid, fetch(
            `https://${lang}.wikipedia.org/api/rest_v1/page/related/${title}`,
            this.#headers
        ).then(res => res.json()));
    }

    async fetch({ id }) {
        if (!id)
            throw Error("Expected object with key `id'.");

        id = Number(id);
        if (Number(id) === -1) {
            return this.random();
        }

        if (this.#relatedCache.has(id)) {
            const article = await this.#relatedCache.get(id);
            this.#cacheRelatedArticles(article);
            return new SourceItem({ text: article.extract, ...article });
        }

        throw new Error("unreachable");
    }

    async getRelated(article) {
        const related_articles = await this.#relatedCache.get(article.pageid);
        
        let options = [{
            id: -1,
            title: "Random Article"
        }]

        for (let i = 0; i < Math.min(3, related_articles.pages.length); ++i) {
            const related_article = related_articles.pages.at(i);

            options.push({
                id: related_article.pageid,
                title: related_article.titles.normalized,
            });

            this.#relatedCache.set(related_article.pageid, related_article);
        }

        return options;
    }
}
