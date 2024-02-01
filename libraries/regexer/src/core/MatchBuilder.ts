import { MatchAction, MatchBatchData, MatchData, MatchFlags, MatchGroup, MatchState } from "@regexer/coreTypes/MatchTypes";
import { Stack } from "@regexer/structures/Stack";

export class MatchBuilder
{
    constructor(flags?: number | MatchFlags, batchSize : number = -1)
    {
        this.flags_ = flags;
        this.matchData = {
            states: [],
            statesCount: 0,
            groups: new Map(),
            success: false
        }

        this.batchSize_ = batchSize;
        this.groups_ = new Map();
    }

    public addState(state : MatchState) : MatchBuilder
    {
        const top : MatchState | undefined = this.matchData.states[this.matchData.states.length-1];

        if((this.flags_ & MatchFlags.SHORTEN_BACKTRACKING))
        {
            if(state?.action & MatchAction.BACKTRACKING)
            {
                if(this.flags_ & MatchFlags.BACKTRACKED_FROM_EXACT)
                    state.fromExact = top?.fromExact ?? [state.regAt[0], state.regAt[1]];

                if(top?.action & MatchAction.BACKTRACKING)
                {
                    this.matchData.states.pop();
                    this.matchData.statesCount--;
                    this.batchPosition_[1]--;
                }
            }
        }

        if((this.flags_ & MatchFlags.BACKTRACK_TRIM_POSITION) && (top?.action & MatchAction.BACKTRACKING))
            top.regAt[1] = top.regAt[0];

        if((this.flags_ & MatchFlags.REMOVE_STATES_WO_EFFECT) && top !== undefined && this.isNoEffectState(state, top))
            return this;

        if(state?.strAt === undefined)
            state.strAt = top.strAt;

        if(this.flags_ & MatchFlags.ADD_GROUPS_TO_STATES)
        {
            state.groups = new Map();

            if(!this.handleGenerateGroupsData(state.groups))
                delete(state.groups);
        }
        
        this.matchData.statesCount++;
        this.matchData.states.push(state);

        if(this.matchData.statesCount > 1)
            this.batchPosition_[1]++;

        return this;
    }

    public set success(value : boolean)
    {
        this.matchData.success = value;
    }

    public isBatchReady() : boolean
    {
        return this.batchSize_ > 0 && this.batchPosition_[1] - this.batchPosition_[0] >= this.batchSize_;
    }

    public getFinalBatch() : MatchBatchData
    {
        this.batchPosition_[1] = this.matchData.statesCount;
        return this.getBatch();
    }

    public getBatch() : MatchBatchData
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

    public isNoEffectState(state1 : MatchState, state2 : MatchState) : boolean
    {
        if(state1.regAt[0] !== state2.regAt[0] || state1.regAt[1] !== state2.regAt[1])
            return false;
        if(state1.strAt?.[0] !== state2.strAt?.[0] || state1.regAt?.[1] !== state2.regAt?.[1])
            return false;
        if(state1.fromExact?.[0] !== state2.fromExact?.[0] || state1.fromExact?.[1] !== state2.fromExact?.[1])
            return false;
        if(state1.action !== state2.action)
            return false;
        return true;
    }

    public updateOption(optionStart: number, optionEnd: number)
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

    public newIncomingGroup(matchGroup: MatchGroup)
    {
        if(matchGroup.name !== undefined)
        {
            if(!this.groups_.has(matchGroup.name))
                this.groups_.set(matchGroup.name, new Stack());
            this.groups_.get(matchGroup.name).push(matchGroup);
            return;
        }
        else
            delete(matchGroup.name);

        if(!this.groups_.has(matchGroup.index))
            this.groups_.set(matchGroup.index, new Stack());

        this.groups_.get(matchGroup.index).push(matchGroup);
    }

    public popGroup(index: number | string)
    {
        let poped = this.groups_.get(index).pop();
        if(poped === null)
            return this.groups_.get(index).pop();
        return poped;
    }

    public pushNullGroupOnIndex(index: number | string)
    { 
        if(!this.groups_.has(index))
            this.groups_.set(index, new Stack());
        return this.groups_.get(index).push(null);
    }

    public finalize() : MatchData
    {
        if(this.batchSize_ > 0)
            this.matchData.states = [];

        if(!this.handleGenerateGroupsData(this.matchData.groups))
            delete(this.matchData.groups);

        return this.matchData;
    }

    private handleGenerateGroupsData(groupsTo: Map<number | string, MatchGroup>)
    {
        for (let value of this.groups_.values())
        {
            let topState = value.top();

            if(topState === null)
            {
                const popped = value.pop();
                topState = value.top();
                value.push(popped);
            }

            if(topState)
                groupsTo.set(topState.name ?? topState.index, topState); 
        }

        if(groupsTo.size <= 0)
            return false;
        return true;
    }

    public matchData: MatchData;
    
    private groups_ : Map<number | string, Stack<MatchGroup | null>>;
    private flags_ ?: number | MatchFlags;
    private batchPosition_ : [number, number] = [0, 0];
    private batchSize_: number;
}