import MenuItem from "./menu/menuItem.js";

export default class Menu extends MenuItem {
    menu = new class extends MenuItem {
        name = "Settings";
        key = "settings";
        items = null;
    };

    stack = Array();
    get isActive() { return this.stack.length > 0 };

    constructor(target, { items }) {
        super();

        this.target = target
        this.menu.items = items;
        this.menu.items.forEach(item => item.addEventListener("change", e => this.updateStatus()));

        this.render();
        this.updateStatus();
    }

    get activeMenu() {
        return this.stack.at(-1);
    }

    activate() {
        this.pushMenu(this.menu);
    }

    render() {
        const menu = this.target.appendChild(document.createElement("menu"));
            menu.appendChild(document.createElement("li"))
                .setHTMLUnsafe(`<span>Settings</span><span class="esc">(esc)</span>`);
            this.liveStatus = menu.appendChild(document.createElement("li"));
    }

    updateStatus() {
        this.liveStatus.textContent = this.menu.items.map(item => String(item)).join(" · ");
    }


    renderMenu(menu) {
        const form = menu.form = document.createElement("form");

        for (const item of menu.items) {
            const label = form.appendChild(document.createElement("label"));
                label.appendChild(document.createTextNode(item.name));
                const input = label.appendChild(document.createElement("input"));
                    input.checked = menu.activeItem === item;
                    input.type = "radio";
                    input.name = menu.key;
                    input.value = item.key;
        }

        return form;
    }

    pushMenu(menu) {
        this.target.append(this.renderMenu(menu));
        menu.form.querySelector("*:checked").focus();
        this.stack.push(menu);
    }

    popMenu() {
        const poppedMenu = this.stack.pop();
        poppedMenu.form.remove();
        delete poppedMenu.form;

        if (this.stack.length > 1)
            this.activeMenu.form.querySelector("*:checked").focus();
    }

    deactivate() {
        document.activeElement.blur();
        while (this.stack.length !== 0) this.popMenu();
    }

    handleKeydown(evt) {
        const char = evt.key;
        const ctrl = evt.ctrlKey;
        const meta = evt.metaKey;

        if (char === "Escape")
            if (this.isActive) this.deactivate();
            else this.activate();

        if (!this.isActive)
            return false;

        if (char === "Backspace") {
            this.popMenu();
            if (!this.isActive) this.deactivate();
            return true;
        }

        if (this.target.contains(evt.target)) {
            const name = evt.target.name;
            const value = evt.target.value;
            
            if (char === "Enter") {
                if (name !== "settings")
                    localStorage.setItem(name, value);

                this.activeMenu?.onChange?.(value, "capturing");
                this.dispatchEvent(new CustomEvent("settingChanged", { detail: {
                    key: this.activeMenu?.key,
                    value,
                }}));

                const menuItem = this.activeMenu.items.find(item => item.key === value);
                const menuItemHasSubMenu = "items" in menuItem;
                if (menuItemHasSubMenu) {
                    const subMenu = this.activeMenu.items.find(item => item.key === value);
                    this.pushMenu(subMenu);
                    return true;
                }

                this.stack.reverse().forEach(menu => {
                    menu?.onChange?.(menu.activeItem.key, "bubbling");
                    this.dispatchEvent(new CustomEvent("deferredSettingChanged", { detail: {
                        key: menu.activeItem.key,
                    }}));
                });

                this.deactivate();
                return true;
            }
        }

        if (/^[hjkl]|^Arrow/.test(char)) {
            evt.preventDefault();
            const inputs = Array.from(this.activeMenu.form.elements);
            const currentInput = inputs.findIndex(input => input.checked);

            let newInput;
            switch (true) {
                case /l|k|Arrow(Right|Down)/.test(char):
                   newInput = inputs.at(currentInput + 1 >= inputs.length ? 0 : currentInput + 1);
                   break;
                case /h|j|Arrow(Left|Up)/.test(char):
                   newInput = inputs.at(currentInput - 1 < 0 ? -1 : currentInput - 1)
                   break;
            }

            newInput.focus();
            newInput.checked = true;

            const name = newInput.name;
            const value = newInput.value;

            this.activeMenu?.onInput?.(value, name);
            this.dispatchEvent(new CustomEvent("settingSelected", { detail: {
                key: this.activeMenu.key,
                value: this.activeMenu.activeItem.key,
            } }));

            return true
        }
    }
}
