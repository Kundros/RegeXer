export class Stack<T> 
{
    constructor(data: T[] = [])
    {
        this.data_ = data;
    }

    public push(item: T) : undefined
    {
        this.data_.push(item);
    }

    public pop() : T | undefined
    {
        return this.data_.pop();
    }

    public top() : T
    {
        return this.data_[this.data_.length - 1]
    }

    public size() : number
    {
        return this.data_.length;
    }

    public clear() : undefined
    {
        this.data_ = [];
    }

    private data_: T[];
}