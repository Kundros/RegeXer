import { RegexElement } from "./RegexElement";

export class RegexOption extends RegexElement
{
    constructor(options?: RegexElement[])
    {
        super();

        this.options_ = options ?? [];
    }

    public addOption(option: RegexElement)
    {
        this.options_.push(option);
    }

    public get options() : RegexElement[]
    {
        return this.options_;
    }

    private options_: RegexElement[];
}