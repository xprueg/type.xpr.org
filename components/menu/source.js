import { StatePopupMenu, MenuOption } from "./menuItem.js";
import Hackernews from "../sources/hackernews.js"
import Wikipedia from "../sources/wikipedia.js"

export default class SourceMenu extends StatePopupMenu {
    label = "Source";
    id = "source";
    subMenus = [
        new Hackernews(),
        new Wikipedia(),
    ];

    get liveStatus() {
        return this.selected.liveStatus;
    }

    maybeLoadUrl(url) {
        for (const source of this.subMenus) {
            if (!source.acceptUrl(url))
                continue;

            this.selected = source;
            return source.fetchUrl(url);
        }
        return false;
    }
}
