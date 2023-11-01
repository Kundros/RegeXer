export class Stack {
    push(item) {
        this.data_.push(item);
    }
    pop() {
        return this.data_.pop();
    }
    peek() {
        return this.data_[this.data_.length - 1];
    }
    size() {
        return this.data_.length;
    }
    data_ = [];
}
