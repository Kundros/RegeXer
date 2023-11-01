export class Stack<T> {
    public push(item: T)
    {
        this.data_.push(item);
    }

    public pop() : T | undefined
    {
        return this.data_.pop();
    }

    public peek() : T
    {
        return this.data_[this.data_.length - 1]
    }

    public size() : number
    {
        return this.data_.length;
    }

    private data_: T[] = [];
}