import { MatchData, RegexMatch } from "@core/RegexMatch";
import { parse, PeggySyntaxError, RegexTypes } from "@core/RegexParser"
import { RegParseException } from "@regexer/exceptions/RegParseException";
import { RegMatchException } from "@regexer/exceptions/RegMatchException";
import { RegexParserErrors } from "./parserTypes";

import { Worker } from 'worker_threads';
import { URL } from 'url';
import * as path from "path";
import { MatchComplete, NewMessage, ReturnMessage } from "./MatchWorkerTypes";

/**
 * @classdesc 
 * Parsing class that creates match structure of matching history 
 * on given input string that can be used for further debug or other usages
 * @class
 */
export class Regexer{
    constructor(regexString : string = "")
    {
        this.newParse(regexString);
    }

    /** 
     * @param regexString your string to be matched against parsed regex
     * @throws {RegParseException} If parsing was unsuccessful
     */
    public newParse(regexString : string = "")
    {
        try{
            const data = parse(regexString);
            this.AST_ = data?.AST;
            this.NFA_ = data?.NFA;
        }
        catch(e) {
            const exception = e as PeggySyntaxError;
            const errorCode = Number.parseInt(exception.message) as RegexParserErrors;

            throw new RegParseException(exception.location.start.offset, exception.location.end.offset, errorCode);
        }

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
    public async match(matchString : string) : Promise<MatchComplete>
    {
        if(this.worker_ === undefined)
            this.renewWorker();

        if(this.NFA_ === undefined || this.AST_ === undefined)
            throw new RegMatchException("Can't match due to unsuccessful regex parse.");

        const pid = this.nextPid++;
        let external_reject : (any) => void, external_resolve : (unknown) => void;

        const result = await new Promise((resolve, reject) => {
            this.worker_.postMessage(<NewMessage>{ type: "match", pid, data: matchString });

            external_reject = (reason?: any) => {
                const returned = reason as ReturnMessage;

                if(returned.pid === pid)
                    reject(reason);
            }

            external_resolve = (value: unknown) => {
                const returned = value as ReturnMessage;

                if(returned.pid === pid)
                    resolve(value);
            }

            this.worker_.on('error', external_reject);
            this.worker_.on('message', external_resolve);
        });

        this.worker_.removeListener('error', external_reject);
        this.worker_.removeListener('message', external_resolve);

        const returned = result as NewMessage;

        if(returned.type === 'error')
            throw new RegMatchException(returned.data as string);

        let data = returned.data as MatchData[];
        let lengthData = data.length;
        const matches : RegexMatch[] = [];

        for(let i = 0 ; i < lengthData ; i++)
            matches.push(new RegexMatch(data[i]));

        return {success: returned.type === 'succeded', matches} as MatchComplete;
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