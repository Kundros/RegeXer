import { RegexElement } from "./RegexElement.js";
export class RegexCapturing extends RegexElement {
    constructor() {
        super();
    }
    finalize() {
        this.rootCapture_ = this.next;
        this.next = undefined;
        this.finalized_ = true;
    }
    isFinalized() {
        return this.finalized_;
    }
    get rootCapture() {
        return this.rootCapture_;
    }
    rootCapture_;
    finalized_ = false;
}
