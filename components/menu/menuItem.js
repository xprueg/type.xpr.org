export class PopupMenu extends EventTarget {
    label;
    subMenus;

    static init(label, subMenus) {
        const _menu = new PopupMenu();
        _menu.label = label;
        _menu.subMenus = subMenus;
        return _menu;
    }

    constructor() {
        super();
    }

    close() {
        this.form.remove();
        delete this.form;
    }

    render() {
        const form = this.form = document.createElement("form");

        for (const subMenu of this.subMenus) {
            const label = form.appendChild(document.createElement("label"));
                label.appendChild(document.createTextNode(subMenu.label));
                const input = subMenu.input = label.appendChild(document.createElement("input"));
                    input.checked = this.selected === subMenu;
                    input.type = "radio";
                    input.subMenu = subMenu;
                    input.name = this.id ?? this.label;
                    input.value = subMenu.key ?? Math.random();
        }

        return this.form;
    }

    set selected(subMenu) {
       subMenu.input.checked = true;
       subMenu.input.focus();
    }

    get selected() {
        return this.subMenus.at(0);
    }

    focus() {
        this.selected.input.focus();
    }

    get focused() {
        return this.subMenus.find(subMenu => subMenu?.input?.checked);
    }

    selectOption() {
        this.selected = this.focused;
    }

    focusPrevOption() {
        const currentInputIdx = this.subMenus.findIndex(subMenu => subMenu?.input?.checked);
        const newInputIdx = currentInputIdx === -1
            ? 0
            : currentInputIdx === 0
                ? this.subMenus.length - 1
                : currentInputIdx - 1;

        const selectedSubMenu = this.subMenus.at(newInputIdx);
        selectedSubMenu.input.checked = true;
        selectedSubMenu.input.focus();
        this.dispatchEvent(new Event("input"));
    }

    focusNextOption() {
        const currentInputIdx = this.subMenus.findIndex(subMenu => subMenu?.input?.checked);
        const newInputIdx = currentInputIdx === -1
            ? 0
            : currentInputIdx >= this.subMenus.length - 1
                ? 0
                : currentInputIdx + 1;

        const selectedSubMenu = this.subMenus.at(newInputIdx);
        selectedSubMenu.input.checked = true;
        selectedSubMenu.input.focus();
        this.dispatchEvent(new Event("input"));
    }
}

export class StatePopupMenu extends PopupMenu {
    id;

    constructor() {
        super();
    }

    get selected() {
        const selectedId = localStorage.getItem(this.id);
        if (selectedId !== null) {
            const menu = this.subMenus.find(subMenu => subMenu.id === selectedId);
            if (menu !== undefined)
                return menu;
        }

        return this.subMenus.at(0);
    }

    set selected(subMenu) {
        super.selected = subMenu;

        localStorage.setItem(this.id, subMenu.id);
    }
}

export class MenuOption extends EventTarget {
    id;
    label;

    constructor(label, id) {
        super();

        this.id = id;
        this.label = label;
    }
}
