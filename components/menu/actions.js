import MenuItem from "./menuItem.js";

export default class Actions extends MenuItem {
    name = "Actions";
    key = "actions";

    toString() {
        return String();
    }

    items = [
        { key: "skip_segment", name: "Skip Word (⌘P)" },
        { key: "skip_item", name: "Skip Item (⌘X)" },
    ];
}
