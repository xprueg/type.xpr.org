import MenuItem from "./menuItem.js";
import Hackernews from "../sources/hackernews.js"
import Wikipedia from "../sources/wikipedia.js"

export default class SourceMenu extends MenuItem {
    name = "Source";
    key = "source";

    items = [ Wikipedia, Hackernews ].map(source => new source());

    maybeLoadUrl(url) {
        for (const source of this.items) {
            if (!source.acceptUrl(url))
                continue;

            this.setActiveItem(source.key);
            return source.fetchUrl(url);
        }
        return false;
    }
}
