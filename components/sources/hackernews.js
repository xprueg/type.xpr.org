import MenuItem from "../menu/menuItem.js";
import SourceItem from "./sourceItem.js"

export default class Hackernews extends MenuItem {
    name = "Hackernews";
    key = "hackernews";

    items = [
        { key: "story", name: "Story" },
        { key: "comment", name: "Comment" },
    ];

    toString() {
        return `${this.name} (${this.activeItem.name})`;
    }

    #maxId = false;

    async _get_random_id() {
        if (this.#maxId === false) {
            const res = await fetch("https://hacker-news.firebaseio.com/v0/maxitem.json");
            this.#maxId = await res.json();
        }

        return Math.floor(Math.random() * this.#maxId);
    }

    acceptUrl(url) {
        if (url.hostname !== "news.ycombinator.com")
            return false;
        if (url.searchParams.get("id") === null)
            return false;
        return true;
    }

    async random(url) {
        let id;
        if (url) {
            id = new URL(url).searchParams.get("id");
        } else {
            id = await this._get_random_id();
        }

        const item = await this.fetch({ id });
        if (item.type !== "comment")
            return this.random();
        if (item.deleted === true)
            return this.random();

        return item;
    }

    async fetchUrl(url) {
        return this.random(url.toString());
    }

    async fetch({ id }) {
        if (!id)
            throw Error("Expected object with key `id'.");

        id = Number(id);
        if (Number(id) === -1)
            return this.random();

        const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const item = await res.json();

        return new SourceItem(item);
    }

    async getRelated(item) {
        let options = [{
            id: -1,
            title: "Random Comment"
        }];

        if (item.kids) {
            options.push({
                id: item.kids.at(Math.floor(Math.random() * item.kids.length)),
                title: "Random Reply"
            });
        }

        const parent = await this.fetch({ id: item.parent });
        for (let i = 1; i < parent.kids.length; ++i) {
            if (parent.kids.at(i - 1) === item.id) {
                const sibling = await this.fetch({ id: parent.kids.at(i) });
                if (!sibling.deleted) {
                    options.push({
                        id: sibling.id,
                        title: "Sibling Comment"
                    });
                    break;
                }
            }
        }

        return options;
    }
}
