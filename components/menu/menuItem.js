export default class MenuItem extends EventTarget {
    onChange(key) {
        localStorage.setItem(this.key, key);
    }

    get activeItem() {
        const storedKey = localStorage.getItem(this.key);
        let item = this.items.find(({ key }) => key === storedKey);
        if (item !== undefined)
            return item;
        return this.items.at(0);
    }

    toString() {
        if (this.activeItem instanceof MenuItem)
            return this.activeItem.toString();
        else return this.activeItem.name;
    }
}
