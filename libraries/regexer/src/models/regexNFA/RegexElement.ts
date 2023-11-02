export class RegexElement
{
    constructor()
    {
        this.followingElements_ = new Set<RegexElement>;
    }

    public folowing() : Set<RegexElement>
    {
        return this.followingElements_;
    }

    public isFolowing(element: RegexElement) : boolean
    {
        return this.followingElements_.has(element);
    }

    public addFolowingElement(element: RegexElement)
    {
        this.followingElements_.add(element);
    }

    protected followingElements_ : Set<RegexElement>;
}