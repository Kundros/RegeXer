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