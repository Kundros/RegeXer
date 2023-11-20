import { test, expect } from '@jest/globals';

import { Regexer } from '../src/models/Regexer';
import { customTypes } from "../src/models/regexParser"

test('empty', () => {
    const regexer = new Regexer();
    const nfaStart = (regexer as any).NFA_ as customTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as customTypes.ASTRoot;

    expect(astRoot?.type).toBe(customTypes.RegexStates.ROOT);
    expect(nfaStart[0].ASTelement).toBe(astRoot);
    expect(astRoot.children.length).toBe(0);
    expect(astRoot.modifiers).toBe(customTypes.Modifiers.NONE);
});

test('string of characters', () => {
    const regexer = new Regexer("abcd");
    const nfaStart = (regexer as any).NFA_ as customTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as customTypes.ASTRoot;

    expect(astRoot.children.length).toBe(4);
    expect(nfaStart.length).toBe(6); // root -> a -> b -> c -> d -> end

    expect(nfaStart[1].ASTelement?.type).toBe(customTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[1].ASTelement as customTypes.ASTPrimitive).chr).toBe("a");
    expect(nfaStart[1].transitions[0]).toStrictEqual(['a', 1]);

    expect(nfaStart[2].ASTelement?.type).toBe(customTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[2].ASTelement as customTypes.ASTPrimitive).chr).toBe("b");
    expect(nfaStart[2].transitions[0]).toStrictEqual(['b', 1]);

    expect(nfaStart[3].ASTelement?.type).toBe(customTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[3].ASTelement as customTypes.ASTPrimitive).chr).toBe("c");
    expect(nfaStart[3].transitions[0]).toStrictEqual(['c', 1]);

    expect(nfaStart[4].ASTelement?.type).toBe(customTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[4].ASTelement as customTypes.ASTPrimitive).chr).toBe("d");
    expect(nfaStart[4].transitions[0]).toStrictEqual(['d', 1]);

    expect(nfaStart[5]).toBe(customTypes.RegexStates.END);
});

test('string of characters and escaped characters', () => {
});

test('test simple option', () => {
});

test('test complex option', () => {
});

test('capturing group 1', () => {
});

test('capturing group 2', () => {
});

test('capturing group 3', () => {
});

test('capturing group combined with option', () => {
});