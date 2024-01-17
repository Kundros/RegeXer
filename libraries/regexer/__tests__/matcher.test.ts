import { test, expect } from '@jest/globals';

import { Regexer } from '../src/core/Regexer';
import { MatchResultsTypes } from '../src/coreTypes/MatchWorkerTypes';

global.__filename = "dist/cjs/core/Regexer";

test("empty", async () => {
    const regexer = new Regexer();

    expect((await regexer.match("")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("aaa")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("487512rewfff)fef")).type).toBe(MatchResultsTypes.SUCCESS);

    regexer.clear();
});

test("one character", async () => {
    const regexer = new Regexer("a");

    expect((await regexer.match("")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("aaa")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("djrkdajmkt")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("djrkd1jmkt")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("d")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("string character", async () => {
    const regexer = new Regexer("test");

    expect((await regexer.match("")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("aaab")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("test")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("aaatest")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("aatesaaa")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("aatastaaa")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("iteration character zero or more", async () => {
    const regexer = new Regexer("a*");

    expect((await regexer.match("")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("aaab")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("bb")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("aaaaaatest")).type).toBe(MatchResultsTypes.SUCCESS);

    regexer.clear();
});

test("iteration character one or more", async () => {
    const regexer = new Regexer("a+");

    expect((await regexer.match("")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("aaab")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("bb")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("aaaaaatest")).type).toBe(MatchResultsTypes.SUCCESS);

    regexer.clear();
});

test("iteration surounded zero or more", async () => {
    const regexer = new Regexer("ba*r");

    expect((await regexer.match("br")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("baaar")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("babar")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("tbaataaaartest")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("a")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("tar")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("iteration surounded one or more", async () => {
    const regexer = new Regexer("ba+r");

    expect((await regexer.match("br")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("baaar")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("babar")).type).toBe(MatchResultsTypes.SUCCESS);

    regexer.clear();
});

test("iteration group surounded 1", async () => {
    const regexer = new Regexer("b(ab)+r");

    expect((await regexer.match("ab")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("babr")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("babar")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("bababr")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("br")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("iteration group surounded 2", async () => {
    const regexer = new Regexer("b(ab)*r");

    expect((await regexer.match("ab")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("bar")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("bababr")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("br")).type).toBe(MatchResultsTypes.SUCCESS);

    regexer.clear();
});

test("option", async () => {
    const regexer = new Regexer("a|b");

    expect((await regexer.match("a")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("b")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("c")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("cdrabr")).type).toBe(MatchResultsTypes.SUCCESS);

    regexer.clear();
});

test("option 2", async () => {
    const regexer = new Regexer("a|(rb+r)");

    expect((await regexer.match("a")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("b")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("rbr")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("rr")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("ggrrab")).type).toBe(MatchResultsTypes.SUCCESS);

    regexer.clear();
});

test("option 2", async () => {
    const regexer = new Regexer("a|(rb+r)");

    expect((await regexer.match("a")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("b")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("rbr")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("rr")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("ggrrab")).type).toBe(MatchResultsTypes.SUCCESS);

    regexer.clear();
});

test("complex match (option, iteration, group)", async () => {
    const regexer = new Regexer("t(a|(rb+r)|dd)+t");

    expect((await regexer.match("a")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("tt")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("tat")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("tddt")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("tarbraddt")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("abrtrbrarbraddta")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("trbbbbrt")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("trbabbbrt")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("tddaddrb")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("SOS (start of string)", async () => {
    const regexer = new Regexer("^a");

    expect((await regexer.match("a")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("ta")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("taaat")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("tttta")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("attttbttt")).type).toBe(MatchResultsTypes.SUCCESS);

    regexer.clear();
});

test("EOS (end of string)", async () => {
    const regexer = new Regexer("a$");

    expect((await regexer.match("a")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("ta")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("taaat")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("tttta")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("attttbttt")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("SOS + EOS (with option)", async () => {
    const regexer = new Regexer("^(a)+|b+$");

    expect((await regexer.match("a")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("ta")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("taaat")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("tttta")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("attttbtttb")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("ab")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("ttttb")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("gabg")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("ba")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("\\w\\W (equivalent: [_0-9a-zA-Z][^_0-9a-zA-Z])", async () => {
    const regexer = new Regexer("\\w\\W");

    expect((await regexer.match("a-")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("_.")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("2§")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("B>")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("aa")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("a0")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("a_")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("aH")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match(".(")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("+0")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match(" 0")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("\\d\\D (equivalent: [0-9][^0-9])", async () => {
    const regexer = new Regexer("\\d\\D");

    expect((await regexer.match("a-")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("09")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("00")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("0a")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("4*")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("1(")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("0\x00")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("7!")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("ga")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("\\s\\S (equivalent: [\\t\\n\\v\\f\\r \\xA0][^\\t\\n\\v\\f\\r \\xA0])", async () => {
    const regexer = new Regexer("\\s\\S");

    expect((await regexer.match("  ")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match(" \n")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("\n\t")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("\na")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("\t0")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match(" g")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("\f'")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("\xA0_")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("\v\v")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("\v\xFF")).type).toBe(MatchResultsTypes.SUCCESS);

    regexer.clear();
});

test("escaped ascii \\[0tnvrf]", async () => {
    const regexer = new Regexer("\0\t\n\v\r\f");

    expect((await regexer.match("\0\t\n\v\r\f")).type).toBe(MatchResultsTypes.SUCCESS);

    regexer.clear();
});

test("list", async () => {
    const regexer = new Regexer("[abc]");

    expect((await regexer.match("a")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("dddb")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("ddcd")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("abc")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("ggdq")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("list hex", async () => {
    const regexer = new Regexer("[\x00\x01]");

    expect((await regexer.match("\x00")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("\x01")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("aaa\x01bb")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("\x02")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("list range", async () => {
    const regexer = new Regexer("[\x00-z]");

    expect((await regexer.match("\x05")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("\x04")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("g")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("~")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("\xAA")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("list negated", async () => {
    const regexer = new Regexer("[^a-zA-Z]");

    expect((await regexer.match("056")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("-")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("(")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("g")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("Z")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

test("list iteration", async () => {
    const regexer = new Regexer("_[a-zA-Z]*_");

    expect((await regexer.match("_abcde_")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("_ABCdeZghl_")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("012__")).type).toBe(MatchResultsTypes.SUCCESS);
    expect((await regexer.match("_ghtw0eg_")).type).toBe(MatchResultsTypes.NO_MATCH);
    expect((await regexer.match("_*_")).type).toBe(MatchResultsTypes.NO_MATCH);

    regexer.clear();
});

