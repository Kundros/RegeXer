import { test, expect } from '@jest/globals';

import { Regexer } from '../src/core/Regexer';
import { MatchFlags, MatchState } from '../src/core/RegexMatch';
import { RegexTypes } from '../src/core/RegexParser';

global.__filename = "dist/cjs/core/Regexer";

test("match setting (SHORTEN_BACKTRACKING + BACKTRACKED_FROM_EXACT)", async () => {
    const regexer = new Regexer("aaaa",
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT | 
        MatchFlags.IGNORE_STR_START_POSITION_CHANGE
    );

    const matches = (await regexer.match("aaa")).matches;

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

test("-", async () => {
    const regexer = new Regexer("a|bb|c|d",
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT |
        MatchFlags.BACKTRACK_TRIM_POSITION |
        MatchFlags.OPTION_ENTERS_SHOW_ACTIVE |
        MatchFlags.OPTION_SHOW_FIRST_ENTER |
        MatchFlags.OPTION_NO_ERROR_RETURN |
        MatchFlags.REMOVE_STATES_WO_EFFECT
    );

    const matches = (await regexer.match("bd")).matches;

    while(matches[0].currentState !== null)
    {
        console.log(matches[0].currentState);
        matches[0].moveForward();
    }

    regexer.clear();
});