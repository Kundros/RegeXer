import { RegexElement } from "./RegexElement";

export class RegexOption extends RegexElement
{
    constructor(options?: RegexElement[])
    {
        super();

        this.options = options ?? [];
    }

    public addOption(option: RegexElement)
    {
        this.options.push(option);
    }

    private options: RegexElement[];
}