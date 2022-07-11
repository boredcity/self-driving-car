class Controls {
    #abortController;
    forward = false;
    left = false;
    right = false;
    reverse = false;
    break = false;

    constructor(controlsType) {
        switch (controlsType) {
            case CONTROLS_TYPE.AI:
            case CONTROLS_TYPE.DUMMY:
                this.forward = true;
                break;
            case CONTROLS_TYPE.ARROWS:
                this.#addKeyboardListeners({
                    ArrowLeft: newValue => (this.left = newValue),
                    ArrowRight: newValue => (this.right = newValue),
                    ArrowUp: newValue => (this.forward = newValue),
                    ArrowDown: newValue => (this.reverse = newValue),
                    ' ': newValue => (this.break = newValue)
                });
                break;
            case CONTROLS_TYPE.WASD:
                this.#addKeyboardListeners({
                    a: newValue => (this.left = newValue),
                    d: newValue => (this.right = newValue),
                    w: newValue => (this.forward = newValue),
                    s: newValue => (this.reverse = newValue),
                    e: newValue => (this.break = newValue)
                });
                break;
        }
    }

    removeKeyboardListeners() {
        this.#abortController?.abort();
    }

    #addKeyboardListeners(controlHandlers) {
        this.removeKeyboardListeners();
        this.#abortController = new AbortController();
        document.addEventListener(
            'keydown',
            evt => controlHandlers[evt.key]?.(true),
            {
                signal: this.#abortController.signal
            }
        );
        document.addEventListener(
            'keyup',
            evt => controlHandlers[evt.key]?.(false),
            {
                signal: this.#abortController.signal
            }
        );
    }
}
