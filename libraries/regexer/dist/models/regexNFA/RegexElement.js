export class RegexElement {
    constructor() { }
    isNext(element) {
        return this.next_ === element;
    }
    setNext(element) {
        this.next_ = element;
    }
    getNext() {
        return this.next_;
    }
    next_;
}
