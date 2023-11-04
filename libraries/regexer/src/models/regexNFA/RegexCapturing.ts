import { RegexElement } from "./RegexElement";

export class RegexCapturing extends RegexElement
{
    constructor()
    {
        super();
    } 

    public finalize()
    {
        this.rootCapture_ = this.next;
        this.next = undefined;

        this.finalized_ = true;
    }

    public isFinalized()
    {
        return this.finalized_;
    }

    public get rootCapture()
    {
        return this.rootCapture_;
    }

    private rootCapture_ : RegexElement;
    private finalized_ = false;
}