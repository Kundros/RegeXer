import { MatchData, RegexMatch } from "@models/RegexMatch";
import { parse, PeggySyntaxError, RegexTypes } from "@models/RegexParser"
import { RegCompileException } from "@exceptions/RegCompileException";

import { Worker } from 'worker_threads';
import { RegMatchException } from "@regexer/exceptions/RegMatchException";
import { URL } from 'url';
import * as path from "path";

type workerReturn = {type: string, pid: number, data: unknown};


/**
 * @classdesc 
 * Parsing class that uses workers and creates match data 
 * on given input that can be used for further debug or other usages
 * @class
 */
export class Regexer{
    constructor(regexString : string = "")
    {
        this.newParse(regexString);
    }

    /** 
     * @param regexString your string to be matched against parsed regex
     * @returns {undefined | [number, number]} 
     * - undefined - if successfull
     * - [number, number] - if unsuccessfull (position from-to where is possibly problem)
     */
    public newParse(regexString : string = "") : undefined | [number, number]
    {
        try{
            const data = parse(regexString);
            this.AST_ = data?.AST;
            this.NFA_ = data?.NFA;
        }
        catch(e) {
            let exception = e as PeggySyntaxError;

            return [exception.location.start.offset, exception.location.end.offset];
        }

        /* DEBUG */
        /*this.NFA_.forEach(element => {
            console.log(element);
        });*/

        if(typeof global !== "undefined") // check if is node
        {
            if(this.worker_ !== undefined)
            {
                this.worker_.postMessage(
                    { 
                        type: "new_data", 
                        data: {
                            AST: this.AST_,
                            NFA: this.NFA_
                        } 
                    });
                return;
            }

            this.renewWorker();
        }
    }

    /** 
     * @param matchString your string to be matched against parsed regex
     * @returns {Promise<{success: boolean, match: RegexMatch}>}
     * @throws {RegMatchException} If some unexpacted error occured
     */
    public async match(matchString : string) : Promise<{success: boolean, match: RegexMatch}>
    {
        if(this.worker_ === undefined)
            this.renewWorker();

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

    /** @returns NFA-like (non deterministic finite automata) structure of parsed regex. */
    public get NFA()
    {
        return this.NFA_;
    }

    /** @returns AST-like structure of parsed regex. */
    public get AST() 
    {
        return this.AST_;
    }

    /** @description clears worker, do before loosing reference to object, hence not waiting for garbage collector. */
    public clear()
    {
        this.worker_.unref();
        this.worker_ = undefined;
    }

    /** @description destroys worker if exists, creates new if does not. */
    private renewWorker()
    {
        // if worker exists then unref it
        if(this.worker_ !== undefined)
        {
            this.worker_.unref();
            this.worker_ = undefined;
        }

        // renew it
        this.worker_ = new Worker(new URL("./MatchingWorker", "file:///" + path.resolve(__filename)), {
            workerData: {
                AST: this.AST_,
                NFA: this.NFA_
            }
        });
    }

    private nextPid : number = 0;
    private worker_? : Worker;
    private AST_?: RegexTypes.ASTRoot;
    private NFA_?: RegexTypes.NFAtype[];
}