import { RegexParserErrors } from "@regexer/models/parserTypes";

export class RegParseException extends Error
{
    constructor(from: number, to: number, errorCode: RegexParserErrors, message: string = "Regex parsing Error") {
        super(message);

        this.from_ = from;
        this.to_ = to;
        this.errorCode_ = errorCode;

        Object.setPrototypeOf(this, RegParseException.prototype);
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

    get errorCode()
    {
        return this.errorCode_;
    }

    private from_ : number;
    private to_ : number;
    private errorCode_ : RegexParserErrors;
}