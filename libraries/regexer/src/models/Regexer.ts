import { RegexMatch } from "@models/RegexMatch";
import { parse, RegexTypes } from "@models/regexParser"
import { RegCompileException } from "@exceptions/RegCompileException";

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';

export class Regexer{
    constructor(regexString : string = "")
    {
        try{
            const data = parse(regexString);
            this.AST_ = data?.AST;
            this.NFA_ = data?.NFA;
        }
        catch(e) {
            console.log(e);
            throw new RegCompileException("unable to parse regex");
        }

        this.worker_ = new Worker("./dist/models/MatchingWorker", {
            workerData: {
                AST: this.AST_,
                NFA: this.NFA_
            }
        });
    }

    public async match(matchString : string)
    {
        let external_reject : (any) => void, external_resolve : (unknown) => void;

        const result = await new Promise((resolve, reject) => {
            this.worker_.postMessage({ type: "match", data: matchString });

            external_reject = (reason?: any) => {
                reject(reason);
            }

            external_resolve = (value: unknown) => {
                resolve(value);
            }

            this.worker_.on('error', external_reject);
            this.worker_.on('message', external_resolve);
        });

        this.worker_.removeListener('error', external_reject);
        this.worker_.removeListener('message', external_resolve);

        return result;
    }

    private worker_ : Worker;
    private AST_: RegexTypes.ASTRoot;
    private NFA_: RegexTypes.NFAState[];
}