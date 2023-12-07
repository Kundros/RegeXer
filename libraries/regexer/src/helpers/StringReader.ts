export class StringReader implements Iterable<string> {
    constructor(string: string)
    {
        this.string_ = string;
    }

    public next() : string | undefined
    {
        if(this.internal_pointer_ + 1 >= this.string_.length)
            return undefined;

        return this.string_[++this.internal_pointer_];
    }

    public before() : string | undefined
    {
        if(this.internal_pointer_ <= 0)
            return undefined;

        return this.string_[--this.internal_pointer_];
    }

    public current() : string
    {
        return this.string_[this.internal_pointer_];
    }

    public peak() : string | undefined
    {
        if(this.internal_pointer_ + 1 >= this.string_.length)
            return undefined;

        return this.string_[this.internal_pointer_ + 1];
    }

    public seek(position: number) : string | undefined
    {
        if(position >= this.string_.length || position < 0)
            return undefined;

        return this.string_[this.internal_pointer_ = position];
    }

    public size() : number
    {
        return this.string_.length;
    }

    public position() : number
    {
        return this.internal_pointer_;
    }

    public reset_pointer() : void
    {
        this.internal_pointer_ = 0;
    }

    [Symbol.iterator](): Iterator<string> 
    {
        return {
            next: () : IteratorResult<string> => {
                return {
                    done: (this.peak() == undefined),
                    value: this.next() ?? ""
                }
            }
        }
    }

    private readonly string_ : string;
    private internal_pointer_ : number = 0;
}