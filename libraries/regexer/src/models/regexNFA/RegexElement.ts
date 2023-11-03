export class RegexElement
{
    constructor()
    {
        this.neighbouringElements_ = new Set<RegexElement>;
    }

    public neighbours() : Set<RegexElement>
    {
        return this.neighbouringElements_;
    }

    public isNeighbouring(element: RegexElement) : boolean
    {
        return this.neighbouringElements_.has(element);
    }

    public addNeighbour(element: RegexElement)
    {
        this.neighbouringElements_.add(element);
    }

    protected neighbouringElements_ : Set<RegexElement>;
}