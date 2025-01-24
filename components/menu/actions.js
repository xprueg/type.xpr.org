import { PopupMenu, MenuOption } from "./menuItem.js";

export default new class Actions extends PopupMenu {
    label = "Actions";
    subMenus = [
        new MenuOption("Skip Word (⌘P)", "skipSegment"),
        new MenuOption("Skip Item (⌘X)", "skipItem"),
    ];

    constructor(...args) {
        super(...args);

        this.subMenus.forEach(subMenu => subMenu.addEventListener("change", evt => {
            this.dispatchEvent(new CustomEvent("action", { detail: subMenu.id }));
        }));
    }
};
