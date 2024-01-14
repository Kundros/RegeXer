import { test, expect } from '@jest/globals';

import { Regexer } from '../src/core/Regexer';
import { MatchFlags, MatchState } from '../src/core/RegexMatch';

global.__filename = "dist/cjs/core/Regexer";

test("match setting (SHORTEN_BACKTRACKING + BACKTRACKED_FROM_EXACT)", async () => {
    const regexer = new Regexer("aaaa",
        MatchFlags.SHORTEN_BACKTRACKING | 
        MatchFlags.BACKTRACKED_FROM_EXACT
    );

    const matches = (await regexer.match("aaa")).matches;

    expect(matches[0].statesCount).toBe(10);

    expect(matches[0].currentState?.type).toBe(4);
    expect(matches[0].currentState?.regAt).toStrictEqual([0, 1]);
    expect(matches[0].currentState?.strAt).toStrictEqual([0, 1]);
    expect(matches[0].currentState?.action).toStrictEqual(undefined);

    matches[0].moveForward();

    expect(matches[0].currentState?.type).toBe(4);
    expect(matches[0].currentState?.regAt).toStrictEqual([1, 2]);
    expect(matches[0].currentState?.strAt).toStrictEqual([0, 2]);

    matches[0].moveForward();

    expect(matches[0].currentState?.type).toBe(4);
    expect(matches[0].currentState?.regAt).toStrictEqual([2, 3]);
    expect(matches[0].currentState?.strAt).toStrictEqual([0, 3]);

    // Backtracking
    matches[0].moveForward();

    expect(matches[0].currentState?.type).toBe(4);
    expect(matches[0].currentState?.regAt).toStrictEqual([0, 1]);
    expect(matches[0].currentState?.strAt).toBe(undefined);
    expect(matches[0].currentState?.fromExact).toStrictEqual([3, 4]);
    // END Backtracking

    matches[0].moveForward();
    expect(matches[0].currentState?.type).toBe(4);
    expect(matches[0].currentState?.regAt).toStrictEqual([0, 1]);
    expect(matches[0].currentState?.strAt).toStrictEqual([1, 2]); // moved in string start from 1

    regexer.clear();
});