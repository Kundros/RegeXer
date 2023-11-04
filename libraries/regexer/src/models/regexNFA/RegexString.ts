import { RegexElement } from "./RegexElement";

export class RegexString extends RegexElement
{
    constructor(str: string)
    {
        super();

        this.string_ = str;
    }

    public append(str: string)
    {
        this.string_ += str;
    }

    public pop()
    {
        const saveLast = this.string_[this.string_.length - 1];
        this.string_ = this.string_.slice(0, -1);
        return saveLast;
    }

    public get string() : string
    {
        return this.string_;
    }

    public get length() : number
    {
        return this.string_.length;
    }

    private string_: string;
}