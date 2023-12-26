export class RegCompileException extends Error
{
    constructor(from: number, to: number) {
        super();

        Object.setPrototypeOf(this, RegCompileException.prototype);
    }

    getPosition() : [number, number]
    {
        return [this.from_, this.to_];
    }

    get from() 
    {
        return this.from_;
    }

    get to() 
    {
        return this.to_;
    }

    private from_: number;
    private to_: number;
}