export class StringReader {
    constructor(string) {
        this.string_ = string;
    }
    next() {
        if (this.internal_pointer_ + 1 >= this.string_.length)
            return null;
        return this.string_[++this.internal_pointer_];
    }
    before() {
        if (this.internal_pointer_ <= 0)
            return null;
        return this.string_[--this.internal_pointer_];
    }
    current() {
        return this.string_[this.internal_pointer_];
    }
    peak() {
        if (this.internal_pointer_ + 1 >= this.string_.length)
            return null;
        return this.string_[this.internal_pointer_ + 1];
    }
    seek(position) {
        if (position >= this.string_.length || position < 0)
            return null;
        return this.string_[this.internal_pointer_ = position];
    }
    size() {
        return this.string_.length;
    }
    position() {
        return this.internal_pointer_;
    }
    reset_pointer() {
        this.internal_pointer_ = -1;
    }
    [Symbol.iterator]() {
        return {
            next: () => {
                return {
                    done: (this.peak() == null),
                    value: this.next() ?? ""
                };
            }
        };
    }
    string_;
    internal_pointer_ = -1;
}
