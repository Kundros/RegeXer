import { RegexElement } from "RegexElement";

export class Symbol extends RegexElement
{
    constructor(symbol: string & { length : 1})
    {
        super();

        this.symbol_ = symbol;
    }

    public get symbol() 
    {
        return this.symbol_;
    }

    private symbol_: string & { length: 1};
}