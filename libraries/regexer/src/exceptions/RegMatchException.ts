export class RegMatchException extends Error
{
    constructor(msg: string) {
        super(msg);

        Object.setPrototypeOf(this, RegMatchException.prototype);
    }

    getMessage() {
        return this.message;
    }
}