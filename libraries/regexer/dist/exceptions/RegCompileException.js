export class RegCompileException extends Error {
    constructor(msg) {
        super(msg);
        Object.setPrototypeOf(this, RegCompileException.prototype);
    }
    getMessage() {
        return this.message;
    }
}
