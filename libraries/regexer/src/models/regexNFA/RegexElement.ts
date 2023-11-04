export class RegexElement
{
    constructor()
    {}

    public isNext(element: RegexElement) : boolean
    {
        return this.next === element;
    }

    public setNext(element: RegexElement)
    {
        this.next = element;
    }

    public next: RegexElement;
}