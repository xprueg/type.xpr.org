export default class RelatedSelection extends EventTarget {
    form = undefined;

    constructor(node) {
        super();
        this.node = node;
    }

    handleKeydown(evt) {
        if (this.form === undefined)
            return false;

        const key = evt.key
        const items = this.form.elements

        switch (key) {
            case "Enter":
                const selected_id = this.node.querySelector("*:checked").value
                this.dispatchEvent(new CustomEvent("selected", { detail: { selectedId: selected_id }}));
                this.clear()
                break
            case "ArrowDown":
            case "ArrowRight":
            case "j":
            case "l": {
                const current_index = Array.from(items).findIndex(i => i.checked)
                const next_index = current_index + 1 >= items.length ? 0 : current_index + 1
                items[current_index].checked = false
                items[next_index].checked = true
                items[next_index].focus()
                break
            }
            case "ArrowUp":
            case "ArrowLeft":
            case "k": 
            case "h": {
                const current_index = Array.from(items).findIndex(i => i.checked)
                const previous_index = current_index - 1 < 0 ? items.length - 1 : current_index - 1
                items[current_index].checked = false
                items[previous_index].checked = true
                items[previous_index].focus()
                break
            }
        }

        return true
    }

    set_options(options) {
        this.form = this.node.appendChild(document.createElement("form"));
            this.form.id = "RelatedItems";
            const span = this.form.appendChild(document.createElement("span"));
                span.id = "related_items_header";
                span.textContent = "UP NEXT";

        for (let i = 0; i < options.length; ++i) {
            const label = this.form.appendChild(document.createElement("label"));
                const input = label.appendChild(document.createElement("input"));
                    input.type = "radio";
                    input.name = "related_selection";
                    input.value = options.at(i).id;
                    input.checked = i === 0;
                const span = label.appendChild(document.createElement("span"));
                    span.textContent = options.at(i).title;
        }

        this.form.elements[0].focus();
    }

    clear(options) {
        this.form = this.node.replaceChildren()
    }
}
