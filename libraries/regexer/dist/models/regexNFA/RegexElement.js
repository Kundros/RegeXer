export class RegexElement {
    constructor() { }
    isNext(element) {
        return this.next === element;
    }
    setNext(element) {
        this.next = element;
    }
    next;
}
