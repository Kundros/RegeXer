import { BatchMatchOptions, MatchData, MatchFlags, MatchingCompleteResponse } from "@regexer/coreTypes/MatchTypes";
import { parse, PeggySyntaxError, RegexTypes } from "@core/RegexParser"
import { RegParseException } from "@exceptions/RegParseException";
import { RegMatchException } from "@exceptions/RegMatchException";
import { RegexParserErrors } from "@regexer/coreTypes/parserTypes";
import { RegexMatch } from "@regexer/core/RegexMatch";
import { MatchWorkerResultTypes, MessageWorkerRecieve, NewData, NewFlags, NewMessage, ReturnBatch, ReturnMessage } from "@regexer/coreTypes/MatchWorkerTypes";

import * as path from "path";

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
     * match is sended in batches so the states that are already preceded can be avalaible sooner than match is finished \
     * each batch will be sent to provided batchCallback \
     * each completed match will be sent to matchCallback (without states those were sent in batches) \
     * finished by calling completeCallback
     */
    public async matchInBatches(matchString : string, options: BatchMatchOptions)
    {
        if(options?.forceStopRunning ?? false) // abort all
            this.terminateAllOngoing();

        const pid = this.nextPid_++;

        this.runningMatchings_.set(pid, {});
        const currentProcess = this.runningMatchings_.get(pid);

        await new Promise<void>((resolve, reject) => {
            this.worker_.postMessage(<MessageWorkerRecieve>{ type: "match", pid, data: matchString, batchSize: options?.batchSize ?? -1 });

            currentProcess.external_reject = (reason?: any) => {
                const returned = reason as ReturnMessage;

                if(returned.pid === pid)
                    reject(reason);
            }

            currentProcess.external_resolve = async (value: unknown) => {
                const returned = value as NewMessage;

                if(returned.pid !== pid)
                    return;

                if(returned.type & MatchWorkerResultTypes.BATCH)
                {
                    const batchMessage = returned as ReturnBatch; 
                    options.batchCallback(batchMessage.data);
                }
                else if(returned.type & MatchWorkerResultTypes.ABORTED)
                {
                    options.completeCallback(MatchingCompleteResponse.ABORTED);
                    resolve();
                }
                else
                {
                    const matchMessage = returned as ReturnMessage;
                    options.matchCallback(matchMessage.data);
                    options.completeCallback(MatchingCompleteResponse.SUCCESS);
                    resolve();
                }
            }

            this.worker_.addEventListener('error', currentProcess.external_reject);
            this.worker_.addEventListener('message', currentProcess.external_resolve);
        });

        // clear listeners from this match session
        this.worker_.removeEventListener('error', currentProcess.external_reject);
        this.worker_.removeEventListener('message', currentProcess.external_resolve);
        this.runningMatchings_.delete(pid);
    }

    public terminateAllOngoing()
    {
        for (let [pid, value] of this.runningMatchings_) {
            if(value.external_resolve !== undefined)
                value.external_resolve(<ReturnMessage>{type: MatchWorkerResultTypes.ABORTED, pid, data: []})

            this.worker_.removeEventListener('error', value.external_reject);
            this.worker_.removeEventListener('message', value.external_resolve);
        }

        this.runningMatchings_.clear();
        this.renewWorker();
    }

    /** 
     * @param matchString your string to be matched against parsed regex
     * @returns {Promise<MatchComplete>}
     * @throws {RegMatchException} If some unexpacted error occured
     */
    public async match(matchString : string, forceStopRunning : boolean = false) : Promise<RegexMatch[]>
    {
        if(this.worker_ === undefined)
            this.renewWorker();

        if(this.NFA_ === undefined || this.AST_ === undefined)
            throw new RegMatchException("Can't match due to unsuccessful regex parse.");

        // abort all proceses if set
        if(forceStopRunning) this.terminateAllOngoing();

        const pid = this.nextPid_++;

        this.runningMatchings_.set(pid, {});
        const currentProcess = this.runningMatchings_.get(pid);

        // begin matching session in worker
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

            this.worker_.addEventListener('error', currentProcess.external_reject);
            this.worker_.addEventListener('message', currentProcess.external_resolve);
        });

        // clear listeners from this match session
        this.worker_.removeEventListener('error', currentProcess.external_reject);
        this.worker_.removeEventListener('message', currentProcess.external_resolve);
        this.runningMatchings_.delete(pid);

        const returned = result as NewMessage;

        if(returned.type & MatchWorkerResultTypes.ERROR)
            throw new RegMatchException(returned.data as string);

        // currently only one match
        let data = returned.data as MatchData;

        return [new RegexMatch(data)];
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
            type: "new_flags", 
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
        this.worker_ = new Worker(new URL("./MatchingWorker", "file:///" + path.resolve(__filename)));

        this.worker_.postMessage({
            type: "new_data",
            data: {
                AST: this.AST_,
                NFA: this.NFA_,
                flags: this.matchFlags_
            }
        });
    }

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