import MenuItem from "./menuItem.js";
import Hackernews from "../sources/hackernews.js"
import Wikipedia from "../sources/wikipedia.js"

export default class SourceMenu extends MenuItem {
    name = "Source";
    key = "source";

    items = [ Wikipedia, Hackernews ].map(source => new source());
}
