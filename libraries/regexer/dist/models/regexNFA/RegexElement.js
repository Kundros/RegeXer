export class RegexElement {
    constructor() {
        this.neighbouringElements_ = new Set;
    }
    neighbours() {
        return this.neighbouringElements_;
    }
    isNeighbouring(element) {
        return this.neighbouringElements_.has(element);
    }
    addNeighbour(element) {
        this.neighbouringElements_.add(element);
    }
    neighbouringElements_;
}
