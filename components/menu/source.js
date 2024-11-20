import MenuItem from "./menuItem.js";
import Hackernews from "../sources/hackernews.js"
import Wikipedia from "../sources/wikipedia.js"

export default class SourceMenu extends MenuItem {
    name = "Source";
    key = "source";

    items = [ Wikipedia, Hackernews ].map(source => new source());

    acceptUrl(url) {
        for (const source of this.items) {
            if (source.acceptUrl(url)) {
                this.setActiveItem(source.key);
                return source.key;
            }
        }
        return false;
    }
}
