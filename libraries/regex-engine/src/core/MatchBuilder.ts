import { 
    MatchAction, 
    BatchData, 
    MatchData, 
    MatchFlags, 
    MatchGroup, 
    MatchState 
} from "@coreTypes/MatchTypes";

export class MatchBuilder
{
    constructor(flags?: number | MatchFlags, batchSize : number = -1)
    {
        this.flags_ = flags ?? MatchFlags.NONE;
        this.matchData = {
            states: [],
            statesCount: 0,
            success: false
        }

        this.batchSize_ = batchSize;
    }

    /** @description process new incoming state */
    public addState(state : MatchState) : MatchBuilder
    {
        const top : MatchState | undefined = this.matchData.states[this.matchData.states.length-1];

        /* shorten sequence of backtracking if flag is set */
        if((this.flags_ & MatchFlags.SHORTEN_BACKTRACKING))
        {
            if(<number>state?.action & MatchAction.BACKTRACKING)
            {
                /* add additional information about exact position of backtracking from */
                if(this.flags_ & MatchFlags.BACKTRACKED_FROM_EXACT)
                    state.fromExact = [state.regAt[0], state.regAt[1]];

                if((<number>top?.action & MatchAction.BACKTRACKING) && top.regAt[0] > state.regAt[0])
                {
                    state.fromExact = top?.fromExact;
                    this.matchData.states.pop();
                    this.matchData.statesCount--;
                    this.batchPosition_[1]--;
                }
            }
        }

        if((this.flags_ & MatchFlags.BACKTRACK_TRIM_POSITION) && (<number>top?.action & MatchAction.BACKTRACKING))
            top.regAt[1] = top.regAt[0];

        if((this.flags_ & MatchFlags.REMOVE_STATES_WO_EFFECT) && top !== undefined && this.isNoEffectState(state, top))
            return this;

        if(state?.strAt === undefined)
            state.strAt = top.strAt;
        
        this.matchData.statesCount++;
        this.matchData.states.push(state);

        if(this.matchData.statesCount > 1)
            this.batchPosition_[1]++;

        return this;
    }

    /** @description set success information */
    public set success(value : boolean)
    {
        this.matchData.success = value;
    }

    /** @description return information if batch is finished (batch size is full) */
    public isBatchReady() : boolean
    {
        return this.batchSize_ > 0 && this.batchPosition_[1] - this.batchPosition_[0] >= this.batchSize_;
    }

    /** @description returns processed final batch */
    public getFinalBatch() : BatchData
    {
        this.batchPosition_[1] = this.matchData.statesCount;
        return this.getBatch();
    }

    /** @description process new incoming groups */
    public newGroups(groups : Map<number, MatchGroup>)
    {
        if(groups.size <= 0)
        {
            delete(this.matchData.groups);
            return;
        }

        const top : MatchState | undefined = this.matchData.states[this.matchData.states.length-1];
        this.matchData.groups = groups;

        if(this.flags_ & (MatchFlags.ADD_GROUPS_TO_STATES))
            top.groups = groups;
    }

    /** @description returns all states of current processed batch */
    public getBatch() : BatchData
    {
        const tmp = this.batchPosition_[0];
        this.batchPosition_[0] = this.batchPosition_[1];

        return {
            batchSize: this.batchPosition_[1] - tmp,
            matchCurrentSize: this.matchData.statesCount,
            batchSpan: [tmp, this.batchPosition_[1]],
            matchStates: this.matchData.states.slice(tmp, this.batchPosition_[1])
        };
    }

    /** @description detection if the new state adds new information */
    public isNoEffectState(state1 : MatchState, state2 : MatchState) : boolean
    {
        if(state1.regAt[0] !== state2.regAt[0] || state1.regAt[1] !== state2.regAt[1])
            return false;
        if(state1.strAt?.[0] !== state2.strAt?.[0] || state1.strAt?.[1] !== state2.strAt?.[1])
            return false;
        if(state1.fromExact?.[0] !== state2.fromExact?.[0] || state1.fromExact?.[1] !== state2.fromExact?.[1])
            return false;
        if(state1.action !== state2.action)
            return false;
        return true;
    }

    /** @description process regex option */
    public updateOption(optionStart: number)
    {
        const states = this.matchData.states;

        if(this.flags_ & MatchFlags.OPTION_NO_ERROR_RETURN)
        {
            const fromAt = states[states.length-1].fromExact ?? [optionStart, optionStart];
            states[states.length-1].regAt = [fromAt[0], fromAt[1]];
        }
        else
            states[states.length-1].regAt = [optionStart, optionStart];
    }

    /** @description return final builded match */
    public finalize() : MatchData
    {
        if(this.batchSize_ > 0)
            this.matchData.states = [];

        if(!this.matchData?.groups)
            delete(this.matchData.groups);

        return this.matchData;
    }

    public matchData: MatchData;
    private flags_ : number | MatchFlags;
    private batchPosition_ : [number, number] = [0, 0];
    private batchSize_: number;
}