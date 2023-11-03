import { RegexElement } from "./RegexElement";

export class RegexCharacter extends RegexElement
{
    constructor(symbol: string)
    {
        super();

        this.symbol_ = symbol;
    }

    public get symbol() 
    {
        return this.symbol_;
    }

    private symbol_: string;
}