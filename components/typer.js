import { Segment, SegmentPair } from "./typer_segment.js"

export default class Typer extends EventTarget {
    segments = Array()
    current_segment_id = 0

    constructor(node) {
        super();

        this.tokenize = (text, locales) => {
            const s = new Intl.Segmenter(locales, { granularity: "word" })
            return Array.from(s.segment(text)).map(({ segment }) => segment)
        };

        window.addEventListener("resize", e => {
            this.updateCaretPosition();
        });

        this.node = node
            this.node.classList.add("typer_container")
            this.node.classList.add("typer_empty")
            this.node.addEventListener("input", evt => this.handleInput(evt))
        this.frame = this.node.appendChild(document.createElement("div"))
            this.frame.classList.add("typer_frame")
            this.caret_frame = this.frame.appendChild(document.createElement("div"))
                this.caret_frame.classList.add("typer_caret_frame")
                const caret = this.caret_frame.appendChild(document.createElement("div"))
                    caret.classList.add("typer_caret")
        this.content = this.frame.appendChild(document.createElement("div"))
            this.content.classList.add("typer_content")
    }

    get contentWidth() {
        return this.content.getBoundingClientRect().width;
    }

    handleKeydown() {
        if (!this.currentSegment)
            return false

        const { activeElement } = document
        const keep_active_element = activeElement instanceof HTMLInputElement
                                    || activeElement instanceof HTMLTextAreaElement
        const segment_input = this.currentSegment.$input

        if (!keep_active_element && activeElement !== segment_input)
            segment_input.focus() 

        return true
    }

    handleInput({ target }) {
        const segment = this.currentSegment
        const chars = segment.chars
        const user_input = target.value

        let ok = String()
        let err = String()
        let future = String()
        UPDATE: {
            for (let i = 0; i < chars.length; ++i) {
                if (chars.substr(0, i + 1) === user_input.substr(0, i + 1))
                    continue

                ok = chars.substr(0, i)
                err = user_input.substr(i) 
                future = chars.substr(i)

                break UPDATE
            }

            ok = chars
        }

        segment.set({ ok, err, future })

        if (chars === user_input)
            this.next_segment()

        if (this.currentSegment)
            this.updateCaretPosition()
    }

    // TODO Skip the whole segment pair instead of just the current segment.
    skipSegment() {
        const segment = this.currentSegment;
        const chars = segment.chars;
        segment.set({ ok: chars });

        this.next_segment();

        if (this.currentSegment)
            this.updateCaretPosition();
    }

    handleStyleChange() {
        if (!this.currentSegment) return;

        this.currentSegment.updateErrorPosition();
        this.updateCaretPosition();
    }

    updateCaretPosition() {
        if (!this.currentSegment) return;

        const { left: relative_x, top: relative_y } = this.node.getBoundingClientRect();
        const { height } = this.currentSegment.$segment.getBoundingClientRect();
        const { top } = this.currentSegment.$ok.getBoundingClientRect();
        const { right } = this.currentSegment.$err.getBoundingClientRect();

        this.caret_frame.style = `
            left: ${Math.round(right)}px;
            top: ${Math.round(top)}px;
            height: ${Math.round(height)}px;
        `;
    }

    forceFinish() {
        this.segments.splice(0).forEach(segment => segment.disable());
        this.node.classList.add("typer_done")
        this.dispatchEvent(new CustomEvent("done"));
    }

    clear() {
        this.segments.splice(0).forEach(segment => segment.disable());
        this.node.classList.add("typer_empty");
    }

    handleFinish() {
        this.node.classList.add("typer_done")
        this.dispatchEvent(new CustomEvent("done"));
    }

    next_segment() {
        this.currentSegment.disable();

        const should_clear_line = (() => {
            if (this.nextSegment === undefined)
                return true;

            const current_y = this.currentSegment.$segment.getBoundingClientRect().top;
            const next_y = this.nextSegment.$segment.getBoundingClientRect().top;
            return current_y < next_y;
        })();


        if (should_clear_line) {
            HIDE_ROW: for (let i = this.current_segment_id; i >= 0; --i) {
                const segment = this.segments.at(i);
                if (segment.isHidden)
                    break HIDE_ROW;
                segment.hide();
            }
        }

        this.current_segment_id += 1;

        if (this.currentSegment === undefined)
            return this.handleFinish();

        this.currentSegment.enable();
    }

    previous_segment() {
        return this.segments.at(this.current_segment_id - 1)
    }

    get currentSegment() {
        return this.segments.at(this.current_segment_id)
    }

    get nextSegment() {
        return this.segments.at(this.current_segment_id + 1)
    }


    set_text(text) {
        this.node.classList.remove("typer_empty");

        const fn = { tokenize: this.tokenize };
        this.dispatchEvent(new CustomEvent("filter", { detail: { filter: "tokenize", fn }}));

        this.text = this.content.dataset.text = text 
        this.segments = fn.tokenize(this.text).map(chars => new Segment(chars));
        this.segment_pairs = this.createSegmentPairs(this.segments)
        this.current_segment_id = 0

        this.node.classList.remove("typer_done")
        this.render()

        this.currentSegment.enable()

        return this
    }

    createSegmentPairs(segments) {
        let segment_pairs = Array()
        for (let i = 0; i < segments.length; ++i) {
            let current_segment = segments.at(i)
            let child_segments = Array(current_segment)

            for (let j = i + 1; j < segments.length; ++j, ++i) {
                const next_segment = segments.at(j)
                if (next_segment.isWhitespace || next_segment.isPunctuation)
                    child_segments.push(next_segment)
                else { break }
            }

            segment_pairs.push(new SegmentPair(child_segments))
        }

        return segment_pairs
    }

    render() {
        this.content.replaceChildren(...this.segment_pairs.map(pair => pair.$root))
        this.updateCaretPosition()
    }

    hideFinishedLines() {
        return
        for (let i = 0, first_in_line = null; i < this.segment_pairs.length; ++i) {
            const pair = this.segment_pairs.at(i)

            if (first_in_line !== null && !pair.isFinished)
                break
            if (pair.isLeadingPair)
                first_in_line = i
            if (pair.isTrailingPair && first_in_line !== null) {
                for (let j = i; j >= first_in_line; --j)
                    this.segment_pairs.at(j).hide()                    

                first_in_line = null
            }
        }
    }
}
