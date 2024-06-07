import { test, expect } from '@jest/globals';

import { Regexer } from '../src/core/Regexer';
import { RegexTypes } from '../src/core/RegexParser';
import { MatchBatchData, MatchData, MatchFlags, MatchState } from '../src/coreTypes/MatchTypes';
import { RegexMatch } from '../src/core/RegexMatch';

global.__filename = "dist/cjs/core/Regexer";

test("match setting (SHORTEN_BACKTRACKING + BACKTRACKED_FROM_EXACT + IGNORE_STR_START_POSITION_CHANGE)", async () => {
    const regexer = new Regexer(
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT | 
        MatchFlags.IGNORE_STR_START_POSITION_CHANGE
    );

    await regexer.parse("aaaa");

    const matches = await regexer.match("aaa");

    expect(matches[0].success).toBe(false);

    expect(matches[0].statesCount).toBe(11);

    expect(matches[0].currentState?.type).toBe(RegexTypes.RegexStates.ROOT);
    expect(matches[0].currentState?.regAt).toStrictEqual([0, 0]);
    expect(matches[0].currentState?.strAt).toStrictEqual([0, 0]);

    matches[0].moveForward();

    expect(matches[0].currentState?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect(matches[0].currentState?.regAt).toStrictEqual([0, 1]);
    expect(matches[0].currentState?.strAt).toStrictEqual([0, 1]);
    expect(matches[0].currentState?.action).toStrictEqual(undefined);

    matches[0].moveForward();

    expect(matches[0].currentState?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect(matches[0].currentState?.regAt).toStrictEqual([1, 2]);
    expect(matches[0].currentState?.strAt).toStrictEqual([0, 2]);

    matches[0].moveForward();

    expect(matches[0].currentState?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect(matches[0].currentState?.regAt).toStrictEqual([2, 3]);
    expect(matches[0].currentState?.strAt).toStrictEqual([0, 3]);

    // Backtracking
    matches[0].moveForward();

    expect(matches[0].currentState?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect(matches[0].currentState?.regAt).toStrictEqual([0, 1]);
    expect(matches[0].currentState?.strAt).toStrictEqual([0, 0]);
    expect(matches[0].currentState?.fromExact).toStrictEqual([3, 4]);
    // END Backtracking

    matches[0].moveForward();
    expect(matches[0].currentState?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect(matches[0].currentState?.regAt).toStrictEqual([0, 1]);
    expect(matches[0].currentState?.strAt).toStrictEqual([1, 2]); // moved in string start from 1

    regexer.clear();
});

test("groups correct ranges 1", async () => {
    const regexer = new Regexer(
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT |
        MatchFlags.BACKTRACK_TRIM_POSITION |
        MatchFlags.OPTION_ENTERS_SHOW_ACTIVE |
        MatchFlags.OPTION_SHOW_FIRST_ENTER |
        MatchFlags.OPTION_NO_ERROR_RETURN |
        MatchFlags.REMOVE_STATES_WO_EFFECT |
        MatchFlags.ADD_GROUPS_TO_STATES
    );

    await regexer.parse('(?:ab(?<name>c)*)+_');
    const match = (await regexer.match('abcdabababcccc_'))[0];

    const nameGroup = match?.groups?.get(1);
    expect(nameGroup?.name).toStrictEqual("name");
    expect(nameGroup?.regAt).toStrictEqual([5, 15]);
    expect(nameGroup?.strAt).toStrictEqual([13, 14]);
    expect(match?.groups?.get(0)).toStrictEqual(undefined);

    regexer.clear();
});

test("groups correct ranges 2", async () => {
    const regexer = new Regexer(
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT |
        MatchFlags.BACKTRACK_TRIM_POSITION |
        MatchFlags.OPTION_ENTERS_SHOW_ACTIVE |
        MatchFlags.OPTION_SHOW_FIRST_ENTER |
        MatchFlags.OPTION_NO_ERROR_RETURN |
        MatchFlags.REMOVE_STATES_WO_EFFECT |
        MatchFlags.ADD_GROUPS_TO_STATES
    );

    await regexer.parse('(ab(?<name>c)*()*)+(_)');
    const match = (await regexer.match('abccabc_'))[0];

    const nameGroup = match?.groups?.get(2);
    expect(nameGroup?.name).toStrictEqual("name");
    expect(nameGroup?.regAt).toStrictEqual([3, 13]);
    expect(nameGroup?.strAt).toStrictEqual([6, 7]);

    const group0 = match?.groups?.get(1);
    expect(group0?.name).toStrictEqual(undefined);
    expect(group0?.regAt).toStrictEqual([0, 18]);
    expect(group0?.strAt).toStrictEqual([4, 7]);

    const group2 = match?.groups?.get(3);
    expect(group2?.name).toStrictEqual(undefined);
    expect(group2?.regAt).toStrictEqual([14, 16]);
    expect(group2?.strAt).toStrictEqual([7, 7]);

    const group3 = match?.groups?.get(4);
    expect(group3?.name).toStrictEqual(undefined);
    expect(group3?.regAt).toStrictEqual([19, 22]);
    expect(group3?.strAt).toStrictEqual([7, 8]);

    regexer.clear();
});

test("groups correct ranges 3", async () => {
    const regexer = new Regexer(
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT |
        MatchFlags.BACKTRACK_TRIM_POSITION |
        MatchFlags.OPTION_ENTERS_SHOW_ACTIVE |
        MatchFlags.OPTION_SHOW_FIRST_ENTER |
        MatchFlags.OPTION_NO_ERROR_RETURN |
        MatchFlags.REMOVE_STATES_WO_EFFECT |
        MatchFlags.ADD_GROUPS_TO_STATES
    );

    await regexer.parse('(?:ab(?<name>c)*()*)+(_)');
    const match = (await regexer.match('abccab_'))[0];

    const group1 = match?.groups?.get(2);
    expect(group1?.name).toStrictEqual(undefined);
    expect(group1?.regAt).toStrictEqual([16, 18]);
    expect(group1?.strAt).toStrictEqual([6, 6]);

    const group2 = match?.groups?.get(3);
    expect(group2?.name).toStrictEqual(undefined);
    expect(group2?.regAt).toStrictEqual([21, 24]);
    expect(group2?.strAt).toStrictEqual([6, 7]);

    regexer.clear();
});

test("test correct batches 1", async () => {
    const regexer = new Regexer(
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT |
        MatchFlags.BACKTRACK_TRIM_POSITION |
        MatchFlags.OPTION_ENTERS_SHOW_ACTIVE |
        MatchFlags.OPTION_SHOW_FIRST_ENTER |
        MatchFlags.OPTION_NO_ERROR_RETURN |
        MatchFlags.REMOVE_STATES_WO_EFFECT |
        MatchFlags.ADD_GROUPS_TO_STATES
    );

    await regexer.parse("(a|b|c)+(?:ab)+[a-z]_");

    const match1 = new RegexMatch();
    await regexer.matchInBatches("abcbbbcccbbccbbccbbababababgjgrehjb", {
        batchCallback: (batch: MatchBatchData) => {
            match1.addBatch(batch);
        },
        matchCallback: (matchFinal: MatchData) => {
            match1.changeMatchInformation(matchFinal);
        },
        batchSize: 7
    });

    const match2 = (await regexer.match("abcbbbcccbbccbbccbbababababgjgrehjb"))[0];
    
    expect(match1.statesCount).toStrictEqual(match2.statesCount);

    let match1State : MatchState | null;
    while((match1State = match1.currentState) !== null)
    {
        expect(match1State?.action).toStrictEqual(match2.currentState?.action);
        expect(match1State?.regAt).toStrictEqual(match2.currentState?.regAt);
        expect(match1State?.strAt).toStrictEqual(match2.currentState?.strAt);
        expect(match1State?.type).toStrictEqual(match2.currentState?.type);
        match1.moveBackward();
        match2.moveForward();
    }

    regexer.clear();
});

test("test correct batches 2", async () => {
    const regexer = new Regexer(
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT |
        MatchFlags.BACKTRACK_TRIM_POSITION |
        MatchFlags.OPTION_ENTERS_SHOW_ACTIVE |
        MatchFlags.OPTION_SHOW_FIRST_ENTER |
        MatchFlags.OPTION_NO_ERROR_RETURN |
        MatchFlags.REMOVE_STATES_WO_EFFECT |
        MatchFlags.ADD_GROUPS_TO_STATES
    );

    await regexer.parse("(a|b|c)+(?:ab)+([a-z])*_");

    const match1 = new RegexMatch();
    await regexer.matchInBatches("abcbbbcccbbccbbccbbababababgjgrehjb_", {
        batchCallback: (batch: MatchBatchData) => {
            match1.addBatch(batch);
        },
        matchCallback: (matchFinal: MatchData) => {
            match1.changeMatchInformation(matchFinal);
        },
        batchSize: 7
    });

    const match2 = (await regexer.match("abcbbbcccbbccbbccbbababababgjgrehjb_"))[0];
    
    expect(match1.statesCount).toStrictEqual(match2.statesCount);
    expect(match1.success).toStrictEqual(match2.success);

    expect(match1.groups?.get(1)?.strAt).toStrictEqual(match2.groups?.get(1)?.strAt);
    expect(match1.groups?.get(1)?.regAt).toStrictEqual(match2.groups?.get(1)?.regAt);
    expect(match1.groups?.get(2)?.strAt).toStrictEqual(match2.groups?.get(2)?.strAt);
    expect(match1.groups?.get(2)?.regAt).toStrictEqual(match2.groups?.get(2)?.regAt);

    let match1State : MatchState | null;
    while((match1State = match1.currentState) !== null)
    {
        expect(match1State?.action).toStrictEqual(match2.currentState?.action);
        expect(match1State?.regAt).toStrictEqual(match2.currentState?.regAt);
        expect(match1State?.strAt).toStrictEqual(match2.currentState?.strAt);
        expect(match1State?.type).toStrictEqual(match2.currentState?.type);
        match1.moveBackward();
        match2.moveForward();
    }

    regexer.clear();
});

test("test correct batches without one await (not terminating the job)", async () => {
    const regexer = new Regexer(
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT |
        MatchFlags.BACKTRACK_TRIM_POSITION |
        MatchFlags.OPTION_ENTERS_SHOW_ACTIVE |
        MatchFlags.OPTION_SHOW_FIRST_ENTER |
        MatchFlags.OPTION_NO_ERROR_RETURN |
        MatchFlags.REMOVE_STATES_WO_EFFECT |
        MatchFlags.ADD_GROUPS_TO_STATES
    );

    await regexer.parse("(a|b|c)+(?:ab)+([a-z])*_");

    const match1 = new RegexMatch();
    regexer.matchInBatches("abcbbbcccbbccbbccbbababababgjgrehjb_", {
        batchCallback: (batch: MatchBatchData) => {
            match1.addBatch(batch);
        },
        matchCallback: (matchFinal: MatchData) => {
            match1.changeMatchInformation(matchFinal);
        },
        batchSize: 7
    });

    const match2 = (await regexer.match("abcbbbcccbbccbbccbbababababgjgrehjb_"))[0];

    let match1State : MatchState | null;
    while((match1State = match1.currentState) !== null)
    {
        expect(match1State?.action).toStrictEqual(match2.currentState?.action);
        expect(match1State?.regAt).toStrictEqual(match2.currentState?.regAt);
        expect(match1State?.strAt).toStrictEqual(match2.currentState?.strAt);
        expect(match1State?.type).toStrictEqual(match2.currentState?.type);
        match1.moveForward();
        match2.moveForward();
    }

    regexer.clear();
});

test("test halt on invalid regex with groups", async () => {
    const regexer = new Regexer(
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT |
        MatchFlags.BACKTRACK_TRIM_POSITION |
        MatchFlags.OPTION_ENTERS_SHOW_ACTIVE |
        MatchFlags.OPTION_SHOW_FIRST_ENTER |
        MatchFlags.OPTION_NO_ERROR_RETURN |
        MatchFlags.REMOVE_STATES_WO_EFFECT |
        MatchFlags.ADD_GROUPS_TO_STATES
    );

    await regexer.parse("(ab(?<name>c)*()*)+(_)");

    const match = (await regexer.match("ab"))[0];

    expect(match.success).toBe(false);
    expect(match.groups).toBe(undefined);

    regexer.clear();
});

/*test("-", async () => {
    const regexer = new Regexer(
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT |
        MatchFlags.BACKTRACK_TRIM_POSITION |
        MatchFlags.OPTION_ENTERS_SHOW_ACTIVE |
        MatchFlags.OPTION_SHOW_FIRST_ENTER |
        MatchFlags.OPTION_NO_ERROR_RETURN |
        MatchFlags.REMOVE_STATES_WO_EFFECT |
        MatchFlags.ADD_GROUPS_TO_STATES
    );

    //await regexer.parse('^(a{2,}|b{3}|(x+)){3,9}$');
    await regexer.parse('(ab(?<name>c)*()*)+(_)');

    //const match = (await regexer.match("aaa"))[0];
    const match = (await regexer.match("abccabc_"))[0];
    console.log(match.success);
    console.log(match.statesCount);

    console.log(match.groups)

    let state : MatchState | null;
    while((state = match.currentState) !== null)
    {
        console.log(state.groups);
        match.moveForward();
    }

    regexer.clear();
});*/