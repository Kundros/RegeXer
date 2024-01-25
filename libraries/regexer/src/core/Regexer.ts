import { RegexMatch } from "@core/RegexMatch";
import { parse, PeggySyntaxError, RegexTypes } from "@core/RegexParser"
import { RegParseException } from "@regexer/exceptions/RegParseException";
import { RegMatchException } from "@regexer/exceptions/RegMatchException";
import { RegexParserErrors } from "../coreTypes/parserTypes";

import { ModuleThread, spawn, Thread, Worker } from 'threads';
import { Matcher } from "./MatchingWorker";
import { MatchResponse, NewData, NewMessage, ReturnBatch, ReturnMatch } from "../coreTypes/MatchWorkerTypes";
import { BatchMatchOptions, MatchData, MatchFlags } from "@regexer/coreTypes/MatchTypes";

/**
 * @classdesc 
 * Parsing class that creates match structure of matching history \
 * on given input string that can be used for further debug or other usages
 * @class
 */
export class Regexer{
    constructor(matchFlags?: number)
    {
        this.matchFlags_ = matchFlags;
    }

    /** 
     * @param regexString your string to be matched against parsed regex
     * @throws {RegParseException} If parsing was unsuccessful
     */
    public async parse(regexString : string = "")
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

        if(this.worker_ !== undefined)
        {
            this.worker_.newData(<NewData>{
                AST: this.AST_,
                NFA: this.NFA_,
                flags: this.matchFlags_
            });
            return;
        }

        await this.renewWorker();
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
        if(options?.forceStopRunning ?? false)
            await this.renewWorker();

        // wait until thread is free
        if(this.activePromise_ !== undefined)
            await this.activePromise_;

        this.activePromise_ = new Promise(async (resolve) => {
            const pid = this.nextPid_++;

            try{
                let batchOrMatch : ReturnBatch | ReturnMatch = await this.worker_.match(pid, matchString, options?.batchSize ?? -1);
        
                if(batchOrMatch.type !== MatchResponse.BATCH)
                {
                    if(batchOrMatch.type & (MatchResponse.SUCCESS | MatchResponse.NO_MATCH))
                        await options.matchCallback((batchOrMatch as ReturnMatch).data);
        
                    await options.completeCallback(batchOrMatch.type);

                    resolve(null);
                    return;
                }
        
                await options.batchCallback((batchOrMatch as ReturnBatch).data);
        
                while((batchOrMatch = await this.worker_?.nextBatch(pid))?.type === MatchResponse.BATCH)
                { 
                    await options.batchCallback((batchOrMatch as ReturnBatch).data);
                }

                if(batchOrMatch === null || batchOrMatch === undefined)
                {
                    await options.completeCallback(MatchResponse.ERROR);
                    resolve(null);
                    return;
                }
        
                if(batchOrMatch.type & (MatchResponse.SUCCESS | MatchResponse.NO_MATCH))
                    await options.matchCallback((batchOrMatch as ReturnMatch).data);
        
                await options.completeCallback(batchOrMatch.type);
            }
            catch(e) {
                await options.completeCallback(MatchResponse.ERROR);
            }

            resolve(null);
        });

        if(this.activePromise_ !== undefined)
        {
            await this.activePromise_;
            delete(this.activePromise_);
        }
    }

    /** 
     * @param matchString your string to be matched against parsed regex
     * @returns {Promise<MatchComplete>}
     * @throws {RegMatchException} If some unexpacted error occured
     */
    public async match(matchString : string, forceStopRunning : boolean = false) : Promise<RegexMatch[]>
    {
        if(this.worker_ === undefined)
            await this.renewWorker();

        if(this.NFA_ === undefined || this.AST_ === undefined)
            throw new RegMatchException("Can't match due to unsuccessful regex parse.");

        // abort all proceses if set
        if(forceStopRunning) 
            await this.renewWorker();

        // wait until thread is free
        if(this.activePromise_ !== undefined)
            await this.activePromise_;

        const pid = this.nextPid_++;

        this.activePromise_ = new Promise(async (resolve) => {
            // match
            resolve(await this.worker_.match(pid, matchString));
        });

        const result = (await this.activePromise_) as NewMessage;

        if(result.type & MatchResponse.ABORTED)
            return [];

        return [new RegexMatch(result.data as MatchData)];
    }

    /** 
     *  @description changes match flags to new one
     *  @param matchFlags flags determinates how final match structure will look like 
     */
    public changeFlags(matchFlags?: number | MatchFlags)
    {
        this.matchFlags_ = matchFlags;
        this.worker_.newFlags(this.matchFlags_);
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
    public async clear()
    {
        try
        {
            if(this.worker_ !== undefined)
            {
                await this.worker_.abort();
                await Thread.terminate(this.worker_);
                this.worker_ = undefined;
            }
        }
        catch(e){}
    }

    /** @description destroys worker if exists, creates new if does not. */
    private async renewWorker()
    {
        await this.clear();
        
        // renew it
        this.worker_ = await spawn<Matcher>(new Worker(/* custom-worker-loader?webpackPath: "../../MatchingWorker.[target].js" */ '../../dist/cjs/core/MatchingWorker.js'));

        await this.worker_.newData(<NewData>{
            AST: this.AST_,
            NFA: this.NFA_,
            flags: this.matchFlags_
        });
    }

    private nextPid_ : number = 0;
    private worker_? : ModuleThread<Matcher>;
    private AST_?: RegexTypes.ASTRoot;
    private NFA_?: RegexTypes.NFAtype[];
    private matchFlags_ ?: number | MatchFlags;

    private activePromise_ ?: Promise<unknown>;
}