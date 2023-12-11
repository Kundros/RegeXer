import { MatchData, RegexMatch } from "@models/RegexMatch";
import { parse, RegexTypes } from "@models/RegexParser"
import { RegCompileException } from "@exceptions/RegCompileException";

import { Worker } from 'worker_threads';
import { RegMatchException } from "@regexer/exceptions/RegMatchException";
import { URL, pathToFileURL } from 'url';
import * as esm from "esm";

type workerReturn = {type: string, pid: number, data: unknown};

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

        /* DEBUG */
        /*this.NFA_.forEach(element => {
            console.log(element);
        });*/

        this.worker_ = new Worker(new URL("./MatchingWorker", esm.import.meta.url), {
            workerData: {
                AST: this.AST_,
                NFA: this.NFA_
            }
        });
    }

    public async match(matchString : string) : Promise<{success: boolean, match: RegexMatch}>
    {
        const pid = this.nextPid++;
        let external_reject : (any) => void, external_resolve : (unknown) => void;

        const result = await new Promise((resolve, reject) => {
            this.worker_.postMessage({ type: "match", pid, data: matchString });

            external_reject = (reason?: any) => {
                const returned = reason as workerReturn;

                if(returned.pid === pid)
                    reject(reason);
            }

            external_resolve = (value: unknown) => {
                const returned = value as workerReturn;

                if(returned.pid === pid)
                    resolve(value);
            }

            this.worker_.on('error', external_reject);
            this.worker_.on('message', external_resolve);
        });

        this.worker_.removeListener('error', external_reject);
        this.worker_.removeListener('message', external_resolve);

        const returned = result as workerReturn;

        if(returned.type === 'error')
            throw new RegMatchException(returned.data as string);

        return {success: returned.type === 'succeded', match: new RegexMatch(returned.data as MatchData)};
    }

    private nextPid : number = 0;
    private worker_ : Worker;
    private AST_: RegexTypes.ASTRoot;
    private NFA_: RegexTypes.NFAtype[];
}