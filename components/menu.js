import { PopupMenu, StatePopupMenu, MenuOption } from "./menu/menuItem.js";

export class Menu {
    openStack = [];

    constructor(target, menu) {
        this.target = target;
        this.menu = menu;
        this.render();
    }

    render() {
        const menu = this.target.appendChild(document.createElement("menu"));
            menu.appendChild(document.createElement("li"))
                .setHTMLUnsafe(`<span>Settings (ESC)`);
            this.liveStatus = menu.appendChild(document.createElement("li"));

        this.renderLiveStatus();
    }

    renderLiveStatus() {
        this.liveStatus.textContent = this.menu.subMenus
                                          .filter(subMenu => subMenu.liveStatus)
                                          .map(subMenu => subMenu.liveStatus)
                                          .join("; ");
    }

    openMenu() {
        this.pushMenu(this.menu);
    }

    pushMenu(menu) {
        this.openStack.push(menu);
        this.target.append(menu.render());
        menu.focus();
    }

    popMenu() {
        const poppedMenu = this.openStack.pop();
        poppedMenu.close();
        this.activeMenu?.focus();
    }

    closeMenu({ bubbles }) {
        while (this.openStack.length !== 0) {
            if (bubbles === true)
                this.activeMenu.dispatchEvent(new Event("change"));
            this.popMenu();
        }

        this.renderLiveStatus();
    }

    get isOpen() {
        return this.openStack.length > 0;
    }

    get activeMenu() {
        return this.openStack.at(-1);
    }

    handleKeydown(evt) {
        const target = evt.target;
        const subMenu = target.subMenu;
        const char = evt.key;
        const ctrl = evt.ctrlKey;
        const meta = evt.metaKey;

        if (char === "Escape") {
            if (this.isOpen) this.closeMenu({ bubbles: false });
            else this.openMenu();
            return true;
        }

        if (!this.isOpen)
            return false;

        if (char === "Backspace") {
            this.popMenu();
            return true;
        }

        if (char === "Enter") {
            this.activeMenu.selectOption();

            if (subMenu instanceof PopupMenu) {
                this.pushMenu(subMenu);
            } else if (subMenu instanceof MenuOption) {
                subMenu.dispatchEvent(new Event("change"));
                this.closeMenu({ bubbles: true });
            }

            return true;
        }

        if (/^[hjkl]|^Arrow/.test(char)) {
            evt.preventDefault();

            switch (true) {
            case /l|k|Arrow(Right|Down)/.test(char):
               this.activeMenu.focusNextOption();
               break;
            case /h|j|Arrow(Left|Up)/.test(char):
               this.activeMenu.focusPrevOption();
               break;
            }

            return true;
        }
    }
};
