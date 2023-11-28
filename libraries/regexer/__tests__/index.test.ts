import { test, expect } from '@jest/globals';

import { Regexer } from '../src/models/Regexer';
import { RegexTypes } from "../src/models/regexParser"

test('empty', () => {
    const regexer = new Regexer();
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(astRoot?.type).toBe(RegexTypes.RegexStates.ROOT);
    expect(nfaStart[0].ASTelement).toBe(astRoot);
    expect(astRoot.children.length).toBe(0);
    expect(astRoot.modifiers).toBe(RegexTypes.Modifiers.NONE);
});

test('string of characters', () => {
    const regexer = new Regexer("abcd");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(astRoot.children.length).toBe(4);
    expect(nfaStart.length).toBe(6); // root -> a -> b -> c -> d -> end

    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[1].ASTelement as RegexTypes.ASTPrimitive).chr).toBe("a");
    expect(nfaStart[1].transitions[0]).toStrictEqual(['a', 1]);

    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[2].ASTelement as RegexTypes.ASTPrimitive).chr).toBe("b");
    expect(nfaStart[2].transitions[0]).toStrictEqual(['b', 1]);

    expect(nfaStart[3].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[3].ASTelement as RegexTypes.ASTPrimitive).chr).toBe("c");
    expect(nfaStart[3].transitions[0]).toStrictEqual(['c', 1]);

    expect(nfaStart[4].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[4].ASTelement as RegexTypes.ASTPrimitive).chr).toBe("d");
    expect(nfaStart[4].transitions[0]).toStrictEqual(['d', 1]);

    expect(nfaStart[5].ASTelement?.type).toBe(RegexTypes.RegexStates.END);
});

test('string of characters and escaped characters', () => {
    const regexer = new Regexer(String.raw`\[\]`);
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[1].ASTelement as RegexTypes.ASTPrimitive).chr).toBe("[");
    expect(nfaStart[1].transitions[0]).toStrictEqual(['[', 1]);

    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[2].ASTelement as RegexTypes.ASTPrimitive).chr).toBe("]");
    expect(nfaStart[2].transitions[0]).toStrictEqual([']', 1]);
});

test('test simple option', () => {
    const regexer = new Regexer("a|b|c");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;


    expect(nfaStart[1].ASTelement).toBe(astRoot.children[0]);
    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.OPTION);
    expect(nfaStart[1].transitions).toStrictEqual([
        [null, 1], 
        [null, 2],
        [null, 3]
    ]);

    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[2].ASTelement as RegexTypes.ASTPrimitive).chr).toBe("a");

    expect(nfaStart[2].transitions[0]).toStrictEqual(['a', 3]);
    expect(nfaStart[3].transitions[0]).toStrictEqual(['b', 2]);
    expect(nfaStart[4].transitions[0]).toStrictEqual(['c', 1]);

    expect(nfaStart[5].ASTelement?.type).toStrictEqual(RegexTypes.RegexStates.END);
});

test('test complex option', () => {
    const regexer = new Regexer("a|a ||");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    // root, option, a, a, " ", null, null, END
    // a|a" "|null|null
    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.OPTION);
    expect(nfaStart[1].transitions).toStrictEqual([
        [null, 1], 
        [null, 2],
        [null, 4],
        [null, 5]
    ]);

    expect(nfaStart[2].transitions[0]).toStrictEqual(['a', 5]);
    expect(nfaStart[3].transitions[0]).toStrictEqual(['a', 1]);
    expect(nfaStart[4].transitions[0]).toStrictEqual([' ', 3]);
    expect(nfaStart[5].transitions[0]).toStrictEqual([null, 2]);
    expect(nfaStart[6].transitions[0]).toStrictEqual([null, 1]);
});

test('capturing group (empty)', () => {
    const regexer = new Regexer("()");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(nfaStart[1].ASTelement).toBe(astRoot.children[0]);
    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    expect(nfaStart[1].transitions).toStrictEqual([
        [null, 1]
    ]);

    const group = astRoot.children[0] as RegexTypes.ASTGroup;

    expect(group.end).toBe(2);
    expect(group.name).toBe(undefined);
    expect(group.detailedType).toBe('C');

    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.END);
});

test('capturing group (nested)', () => {
    const regexer = new Regexer("(ab(cd)e())");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    expect(nfaStart[1].transitions).toStrictEqual([
        [null, 1]
    ]);

    const group1 = astRoot.children[0] as RegexTypes.ASTGroup;
    expect(group1.end).toBe(11);

    expect(nfaStart[2].transitions[0]).toStrictEqual(['a', 1]);
    expect(nfaStart[3].transitions[0]).toStrictEqual(['b', 1]);

    expect(nfaStart[4].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    const group2 = nfaStart[4].ASTelement as RegexTypes.ASTGroup;
    expect(group2.end).toBe(7);

    expect(nfaStart[7].transitions[0]).toStrictEqual(['e', 1]);

    expect(nfaStart[8].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    const group3 = nfaStart[8].ASTelement as RegexTypes.ASTGroup;
    expect(group3.end).toBe(10);

    expect(nfaStart[9].ASTelement?.type).toBe(RegexTypes.RegexStates.END);
});

test('capturing group (combining types)', () => {
    const regexer = new Regexer("(?:a(?<myName>b))(c)");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    expect(nfaStart[1].transitions).toStrictEqual([
        [null, 1]
    ]);

    const group1 = astRoot.children[0] as RegexTypes.ASTGroup;
    expect(group1.detailedType).toBe("NC");
    expect(group1.name).toBe(undefined);

    expect(nfaStart[3].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    const group2 = nfaStart[3].ASTelement as RegexTypes.ASTGroup;
    expect(group2.detailedType).toBe("N");
    expect(group2.name).toBe("myName");

    expect(nfaStart[5].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    const group3 = nfaStart[5].ASTelement as RegexTypes.ASTGroup;
    expect(group3.detailedType).toBe("C");
    expect(group3.name).toBe(undefined);
});

test('capturing group combined with option', () => {
    const regexer = new Regexer("a|(?:b(c))|(?<name>de)aa");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.OPTION);
    expect(nfaStart[1].transitions).toStrictEqual([
        [null, 1],
        [null, 2],
        [null, 6]
    ]);

    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect(nfaStart[3].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    expect(nfaStart[7].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);

    expect(nfaStart[6].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);

    // on end of each option we need to jump to end of option
    expect(nfaStart[2].transitions[0]).toStrictEqual(['a', 10]);
    expect(nfaStart[6].transitions[0]).toStrictEqual(['c', 6]);
    expect(nfaStart[9].transitions[0]).toStrictEqual(['e', 1]);

    expect(nfaStart[10].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);

    expect(nfaStart[10].transitions[0]).toStrictEqual(['a', 1]);
    expect(nfaStart[11].transitions[0]).toStrictEqual(['a', 1]);

    expect(nfaStart[12].ASTelement?.type).toBe(RegexTypes.RegexStates.END);
});