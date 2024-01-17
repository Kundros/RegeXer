import { MatchData, MatchFlags, RegexMatch } from "@core/RegexMatch";
import { parse, PeggySyntaxError, RegexTypes } from "@core/RegexParser"
import { RegParseException } from "@regexer/exceptions/RegParseException";
import { RegMatchException } from "@regexer/exceptions/RegMatchException";
import { RegexParserErrors } from "../coreTypes/parserTypes";

import { Worker } from 'worker_threads';
import { URL } from 'url';
import * as path from "path";
import { MatchComplete, MatchResultsTypes, MessageWorkerRecieve, NewData, NewFlags, NewMessage, ReturnMessage } from "../coreTypes/MatchWorkerTypes";

/**
 * @classdesc 
 * Parsing class that creates match structure of matching history \
 * on given input string that can be used for further debug or other usages
 * @class
 */
export class Regexer{
    constructor(regexString : string = "", matchFlags?: number | MatchFlags)
    {
        this.matchFlags_ = matchFlags;
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
                        data: <NewData>{
                            AST: this.AST_,
                            NFA: this.NFA_,
                            flags: this.matchFlags_
                        }
                    });
                return;
            }

            this.renewWorker();
        }
    }

    /** 
     * @description 
     *  match is sended in batches so the states that are already preceded can be avalaible sooner than match is finished \
     *  you can recieve the batches from queue when avalaible
     */
    public async matchInBatches(matchString : string, batchSize : number = -1)
    {

    }

    public async getBatch()
    {

    }

    /** 
     * @param matchString your string to be matched against parsed regex
     * @returns {Promise<MatchComplete>}
     * @throws {RegMatchException} If some unexpacted error occured
     */
    public async match(matchString : string, forceStopRunning : boolean = false) : Promise<MatchComplete>
    {
        if(this.worker_ === undefined)
            this.renewWorker();

        if(this.NFA_ === undefined || this.AST_ === undefined)
            throw new RegMatchException("Can't match due to unsuccessful regex parse.");

        if(forceStopRunning)
        {
            for (let [pid, value] of this.runningMatchings_) {
                if(value.external_resolve !== undefined)
                    value.external_resolve(<ReturnMessage>{type: MatchResultsTypes.ABORTED, pid, data: []})

                this.worker_.removeListener('error', value.external_reject);
                this.worker_.removeListener('message', value.external_resolve);
            }

            this.runningMatchings_.clear();
            this.renewWorker();
        }

        const pid = this.nextPid_++;

        this.runningMatchings_.set(pid, {});
        const currentProcess = this.runningMatchings_.get(pid);

        const result = await new Promise((resolve, reject) => {
            this.worker_.postMessage(<MessageWorkerRecieve>{ type: "match", pid, data: matchString });

            currentProcess.external_reject = (reason?: any) => {
                const returned = reason as ReturnMessage;

                if(returned.pid === pid)
                    reject(reason);
            }

            currentProcess.external_resolve = (value: unknown) => {
                const returned = value as ReturnMessage;

                if(returned.pid === pid)
                    resolve(value);
            }

            this.worker_.on('error', currentProcess.external_reject);
            this.worker_.on('message', currentProcess.external_resolve);
        });

        this.worker_.removeListener('error', currentProcess.external_reject);
        this.worker_.removeListener('message', currentProcess.external_resolve);
        this.runningMatchings_.delete(pid);

        const returned = result as NewMessage;

        if(returned.type & MatchResultsTypes.ERROR)
            throw new RegMatchException(returned.data as string);

        let data = returned.data as MatchData[];
        let lengthData = data.length;
        const matches : RegexMatch[] = [];

        for(let i = 0 ; i < lengthData ; i++)
            matches.push(new RegexMatch(data[i]));

        return <MatchComplete>{type: returned.type, matches};
    }

    /** 
     *  @description changes match flags to new one
     *  @param matchFlags flags determinates how final match structure will look like 
     */
    public changeFlags(matchFlags?: number | MatchFlags)
    {
        this.matchFlags_ = matchFlags;
        this.worker_.postMessage(
        { 
            type: "new_data", 
            data: <NewFlags>{
                flags: this.matchFlags_
            }
        });
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
        if(this.worker_ !== undefined)
        {
            this.worker_.terminate();
            this.worker_ = undefined;
        }
    }

    /** @description destroys worker if exists, creates new if does not. */
    private renewWorker()
    {
        this.clear();

        // renew it
        this.worker_ = new Worker(new URL("./MatchingWorker", "file:///" + path.resolve(__filename)), {
            workerData: <NewData>{
                AST: this.AST_,
                NFA: this.NFA_,
                flags: this.matchFlags_
            }
        });
    }

    private batches_ : MatchBatch[]; 
    private nextPid_ : number = 0;
    private worker_? : Worker;
    private AST_?: RegexTypes.ASTRoot;
    private NFA_?: RegexTypes.NFAtype[];
    private matchFlags_ ?: number | MatchFlags;

    private runningMatchings_ = new Map<number, {
        external_reject? : (any) => void,
        external_resolve? : (unknown) => void
    }>();
}

export type MatchBatch = {
    batchSize: number,
    matchCurrentSize: number,
    matches : {index: number, match: MatchData}[]
}