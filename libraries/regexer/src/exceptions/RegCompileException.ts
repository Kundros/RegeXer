export class RegCompileException extends Error
{
    constructor(msg: string) {
        super(msg);

        Object.setPrototypeOf(this, RegCompileException.prototype);
    }

    getMessage() {
        return this.message;
    }
}