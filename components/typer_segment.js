export class SegmentPair {
    constructor(segments) {
        this.segments = segments

        const span = document.createElement("span");
            span.classList.add("segment_pair");

        for (const segment of this.segments)
            span.append(segment.$segment);

        this.$root = span;
    } 

    push(segment) {
        this.segments.push(segment);
    }

    hide() {
        this.segments.forEach(segment => segment.hide())
    }

    get isHidden() {
        return this.segments.every(segment => segment.isHidden);
    }

    get isFinished() {
        return this.segments.every(segment => segment.isFinished);
    }
}

export class Segment {
    static states = {
        pending: "segment_pending",
        active: "segment_active",
        finished: "segment_finished",
        hidden: "segment_hidden",
    };

    #state;
    get state() {
        return this.#state;
    }

    set state(new_state) {
        this.#state = new_state;
        
        for (const state of Object.values(Segment.states))
            this.$segment.classList.toggle(state, false);
        this.$segment.classList.toggle(new_state, true);
    }

    constructor(chars) {
        this.render()
        this.chars = chars

        this.set({ future: this.chars })
        
        if (this.isWhitespace)
            this.$segment.classList.add("whitespace")
    }

    get isWhitespace() {
        return /^\s+$/.test(this.chars)
    }

    get isPunctuation() {
        return /^[.,;!?]$/.test(this.chars)
    }

    get isHidden() {
        return this.state === Segment.states.hidden;
    }

    get isFinished() {
        return this.state === Segment.states.finished || this.state === Segment.states.hidden;
    }

    render() {
        const segment = document.createElement("span")
            segment.classList.add("segment")

        const input = document.createElement("input")
            input.classList.add("segment_input")
            input.disabled = true

        const segment_live = document.createElement("span")
            segment_live.classList.add("segment_live")
            const segment_ok = document.createElement("span")
                segment_ok.classList.add("segment_ok")
            const segment_err = document.createElement("span")
                segment_err.classList.add("segment_err")
            segment_live.append(segment_ok, segment_err)

        const segment_auto = document.createElement("span")
            segment_auto.classList.add("segment_auto")
            const segment_fut = document.createElement("span")
                segment_fut.classList.add("segment_fut")
            segment_auto.append(segment_fut)

        segment.append(input, segment_live, segment_auto)

        this.$segment = segment
        this.$input = input
        this.$ok = segment_ok
        this.$err = segment_err
        this.$future = segment_fut

        this.state = Segment.states.pending;
    }

    set({ ok = String(), err = String(), future = String() }) {
        this.$segment.dataset.text = ok + future
        this.$ok.textContent = ok
        this.$err.textContent = err.replace(/\s/g, "␣")
        this.$future.textContent = future

        this.updateErrorPosition();
    }

    updateErrorPosition() {
        this.$err.style.left = `${this.$ok.clientWidth}px`
    }

    enable() {
        this.$input.removeAttribute("disabled");
        this.state = Segment.states.active;
    }

    disable() {
        this.$input.setAttribute("disabled", true)
        this.state = Segment.states.finished;
    }

    hide() {
        this.state = Segment.states.hidden;
    }
}
