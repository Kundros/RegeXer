export class RegexElement
{
    constructor()
    {}

    public isNext(element: RegexElement) : boolean
    {
        return this.next_ === element;
    }

    public setNext(element: RegexElement)
    {
        this.next_ = element;
    }

    public getNext()
    {
        return this.next_;
    }

    protected next_ : RegexElement;
}