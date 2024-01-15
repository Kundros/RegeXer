import { test, expect } from '@jest/globals';

import { Regexer } from '../src/core/Regexer';
import { RegexTypes } from "../src/core/RegexParser"

global.__filename = "dist/cjs/core/Regexer";

test('empty', () => {
    const regexer = new Regexer();
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(astRoot?.type).toBe(RegexTypes.RegexStates.ROOT);
    expect(nfaStart[0].ASTelement).toBe(astRoot);
    expect(astRoot.children.length).toBe(0);
    expect(astRoot.modifiers).toBe(RegexTypes.Modifiers.NONE);

    regexer.clear();
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

    regexer.clear();
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

    regexer.clear();
});

test('test simple option', () => {
    const regexer = new Regexer("a|b|c");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;


    expect(nfaStart[1].ASTelement).toBe(astRoot.children[0]);
    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.OPTION);
    expect(nfaStart[1].transitions).toStrictEqual([
        [null, 1], 
        [null, 3],
        [null, 5]
    ]);

    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect((nfaStart[2].ASTelement as RegexTypes.ASTPrimitive).chr).toBe("a");

    expect(nfaStart[3].transitions[0]).toStrictEqual([null, 5]);
    expect(nfaStart[5].transitions[0]).toStrictEqual([null, 3]);
    expect(nfaStart[7].transitions[0]).toStrictEqual([null, 1]);

    expect(nfaStart[8].ASTelement?.type).toStrictEqual(RegexTypes.RegexStates.END);

    regexer.clear();
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
        [null, 3],
        [null, 6],
        [null, 7]
    ]);

    expect(nfaStart[3].transitions[0]).toStrictEqual([null, 6]);
    expect(nfaStart[6].transitions[0]).toStrictEqual([null, 3]);
    expect(nfaStart[7].transitions[0]).toStrictEqual([null, 2]);
    expect(nfaStart[8].transitions[0]).toStrictEqual([null, 1]);

    regexer.clear();
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

    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP_END);
    expect(nfaStart[3].ASTelement?.type).toBe(RegexTypes.RegexStates.END);

    regexer.clear();
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
    expect(nfaStart[11].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP_END);
    expect(group1.end).toBe(11);

    expect(nfaStart[2].transitions[0]).toStrictEqual(['a', 1]);
    expect(nfaStart[3].transitions[0]).toStrictEqual(['b', 1]);

    expect(nfaStart[4].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    expect(nfaStart[7].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP_END);
    const group2 = nfaStart[4].ASTelement as RegexTypes.ASTGroup;
    expect(group2.end).toBe(7);

    expect(nfaStart[8].transitions[0]).toStrictEqual(['e', 1]);

    expect(nfaStart[9].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    expect(nfaStart[10].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP_END);
    const group3 = nfaStart[9].ASTelement as RegexTypes.ASTGroup;
    expect(group3.end).toBe(10);


    expect(nfaStart[12].ASTelement?.type).toBe(RegexTypes.RegexStates.END);

    regexer.clear();
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

    expect(nfaStart[7].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    const group3 = nfaStart[7].ASTelement as RegexTypes.ASTGroup;
    expect(group3.detailedType).toBe("C");
    expect(group3.name).toBe(undefined);

    regexer.clear();
});

test('capturing group combined with option', () => {
    const regexer = new Regexer("a|(?:b(c))|(?<name>de)aa");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.OPTION);
    expect(nfaStart[1].transitions).toStrictEqual([
        [null, 1],
        [null, 3],
        [null, 10]
    ]);

    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect(nfaStart[4].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    expect(nfaStart[11].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    expect(nfaStart[8].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP_END);
    expect(nfaStart[9].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP_END);

    expect(nfaStart[7].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);

    // on end of each option we need to jump to end of option
    expect(nfaStart[3].transitions[0]).toStrictEqual([null, 15]);
    expect(nfaStart[10].transitions[0]).toStrictEqual([null, 8]);
    expect(nfaStart[17].transitions[0]).toStrictEqual([null, 1]);

    expect(nfaStart[15].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);

    expect(nfaStart[15].transitions[0]).toStrictEqual(['a', 1]);
    expect(nfaStart[16].transitions[0]).toStrictEqual(['a', 1]);

    expect(nfaStart[18].ASTelement?.type).toBe(RegexTypes.RegexStates.END);

    regexer.clear();
});

test('iteration zero or more', () => {
    const regexer = new Regexer("a*");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.ITERATION_ZERO);
    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect(nfaStart[3].ASTelement?.type).toBe(RegexTypes.RegexStates.ITERATION_END);

    expect(nfaStart[1].transitions[0]).toStrictEqual([null, 1]);
    expect(nfaStart[1].transitions[1]).toStrictEqual([null, 3]);
    expect(nfaStart[3].transitions[0]).toStrictEqual([null, -1]);
    expect(nfaStart[3].transitions[1]).toStrictEqual([null, 1]);

    regexer.clear();
});

test('iteration one or more', () => {
    const regexer = new Regexer("a+");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.ITERATION_ONE);
    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect(nfaStart[3].ASTelement?.type).toBe(RegexTypes.RegexStates.ITERATION_END);

    expect(nfaStart[1].transitions[0]).toStrictEqual([null, 1]);
    expect(nfaStart[1].transitions[1]).toStrictEqual(undefined); // without option of jumping out of bound
    expect(nfaStart[3].transitions[0]).toStrictEqual([null, -1]);
    expect(nfaStart[3].transitions[1]).toStrictEqual([null, 1]);

    regexer.clear();
});

test('complex regex (iteration, group, option)', () => {
    const regexer = new Regexer("(a|b+)*");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    // (...)*
    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.ITERATION_ZERO);

    // (...|...)
    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP);
    expect(nfaStart[3].ASTelement?.type).toBe(RegexTypes.RegexStates.OPTION);

    // (a|
    expect(nfaStart[4].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect(nfaStart[5].ASTelement?.type).toBe(RegexTypes.RegexStates.OPTION_END);

    // b+)*
    expect(nfaStart[6].ASTelement?.type).toBe(RegexTypes.RegexStates.ITERATION_ONE);
    expect(nfaStart[7].ASTelement?.type).toBe(RegexTypes.RegexStates.PRIMITIVE);
    expect(nfaStart[8].ASTelement?.type).toBe(RegexTypes.RegexStates.ITERATION_END);
    expect(nfaStart[9].ASTelement?.type).toBe(RegexTypes.RegexStates.OPTION_END);
    
    
    expect(nfaStart[10].ASTelement?.type).toBe(RegexTypes.RegexStates.GROUP_END); // nfa group end
    expect(nfaStart[11].ASTelement?.type).toBe(RegexTypes.RegexStates.ITERATION_END);

    // END
    expect(nfaStart[12].ASTelement?.type).toBe(RegexTypes.RegexStates.END);
    
    expect(nfaStart[1].transitions[0]).toStrictEqual([null, 1]);
    expect(nfaStart[1].transitions[1]).toStrictEqual([null, 11]);

    expect(nfaStart[6].transitions[0]).toStrictEqual([null, 1]);
    expect(nfaStart[6].transitions[1]).toStrictEqual(undefined);

    expect(nfaStart[3].transitions[0]).toStrictEqual([null, 1]);
    expect(nfaStart[3].transitions[1]).toStrictEqual([null, 3]);

    expect(nfaStart[5].transitions[0]).toStrictEqual([null, 5]);
    expect(nfaStart[9].transitions[0]).toStrictEqual([null, 1]);

    regexer.clear();
});

test('start end end of string (^$)', () => {
    const regexer = new Regexer("^$");
    const nfaStart = (regexer as any).NFA_ as RegexTypes.NFAState[];
    const astRoot = (regexer as any).AST_ as RegexTypes.ASTRoot;

    expect(nfaStart[1].ASTelement?.type).toBe(RegexTypes.RegexStates.START_STRING);
    expect(nfaStart[2].ASTelement?.type).toBe(RegexTypes.RegexStates.END_STRING);
    expect(nfaStart[3].ASTelement?.type).toBe(RegexTypes.RegexStates.END);

    expect(nfaStart[1].transitions[0]).toStrictEqual([null, 1]);
    expect(nfaStart[2].transitions[0]).toStrictEqual([null, 1]);

    regexer.clear();
});