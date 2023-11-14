export class Stack {
    constructor(data = []) {
        this.data_ = data;
    }
    push(item) {
        this.data_.push(item);
    }
    pop() {
        return this.data_.pop();
    }
    top() {
        return this.data_[this.data_.length - 1];
    }
    size() {
        return this.data_.length;
    }
    clear() {
        this.data_ = [];
    }
    data_;
}
