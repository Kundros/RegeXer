import { test, expect } from '@jest/globals';

import { Regexer } from '../src/models/Regexer';
import { RegexTypes } from "../src/models/RegexParser"

global.__filename = "dist/cjs/models/Regexer";

test("empty", async () => {
    const regexer = new Regexer();

    expect((await regexer.match("")).success).toBe(true);
    expect((await regexer.match("aaa")).success).toBe(true);
    expect((await regexer.match("487512rewfff)fef")).success).toBe(true);

    regexer.clear();
});

test("one character", async () => {
    const regexer = new Regexer("a");

    expect((await regexer.match("")).success).toBe(false);
    expect((await regexer.match("aaa")).success).toBe(true);
    expect((await regexer.match("djrkdajmkt")).success).toBe(true);
    expect((await regexer.match("djrkd1jmkt")).success).toBe(false);
    expect((await regexer.match("d")).success).toBe(false);

    regexer.clear();
});

test("string character", async () => {
    const regexer = new Regexer("test");

    expect((await regexer.match("")).success).toBe(false);
    expect((await regexer.match("aaab")).success).toBe(false);
    expect((await regexer.match("test")).success).toBe(true);
    expect((await regexer.match("aaatest")).success).toBe(true);
    expect((await regexer.match("aatesaaa")).success).toBe(false);
    expect((await regexer.match("aatastaaa")).success).toBe(false);

    regexer.clear();
});

test("iteration character zero or more", async () => {
    const regexer = new Regexer("a*");

    expect((await regexer.match("")).success).toBe(true);
    expect((await regexer.match("aaab")).success).toBe(true);
    expect((await regexer.match("bb")).success).toBe(true);
    expect((await regexer.match("aaaaaatest")).success).toBe(true);

    regexer.clear();
});

test("iteration character one or more", async () => {
    const regexer = new Regexer("a+");

    expect((await regexer.match("")).success).toBe(false);
    expect((await regexer.match("aaab")).success).toBe(true);
    expect((await regexer.match("bb")).success).toBe(false);
    expect((await regexer.match("aaaaaatest")).success).toBe(true);

    regexer.clear();
});

test("iteration surounded zero or more", async () => {
    const regexer = new Regexer("ba*r");

    expect((await regexer.match("br")).success).toBe(true);
    expect((await regexer.match("baaar")).success).toBe(true);
    expect((await regexer.match("babar")).success).toBe(true);
    expect((await regexer.match("tbaataaaartest")).success).toBe(false);
    expect((await regexer.match("a")).success).toBe(false);
    expect((await regexer.match("tar")).success).toBe(false);

    regexer.clear();
});

test("iteration surounded one or more", async () => {
    const regexer = new Regexer("ba+r");

    expect((await regexer.match("br")).success).toBe(false);
    expect((await regexer.match("baaar")).success).toBe(true);
    expect((await regexer.match("babar")).success).toBe(true);

    regexer.clear();
});

test("iteration group surounded 1", async () => {
    const regexer = new Regexer("b(ab)+r");

    expect((await regexer.match("ab")).success).toBe(false);
    expect((await regexer.match("babr")).success).toBe(true);
    expect((await regexer.match("babar")).success).toBe(false);
    expect((await regexer.match("bababr")).success).toBe(true);
    expect((await regexer.match("br")).success).toBe(false);

    regexer.clear();
});

test("iteration group surounded 2", async () => {
    const regexer = new Regexer("b(ab)*r");

    expect((await regexer.match("ab")).success).toBe(false);
    expect((await regexer.match("bar")).success).toBe(false);
    expect((await regexer.match("bababr")).success).toBe(true);
    expect((await regexer.match("br")).success).toBe(true);

    regexer.clear();
});

test("option", async () => {
    const regexer = new Regexer("a|b");

    expect((await regexer.match("a")).success).toBe(true);
    expect((await regexer.match("b")).success).toBe(true);
    expect((await regexer.match("c")).success).toBe(false);
    expect((await regexer.match("cdrabr")).success).toBe(true);

    regexer.clear();
});

test("option 2", async () => {
    const regexer = new Regexer("a|(rb+r)");

    expect((await regexer.match("a")).success).toBe(true);
    expect((await regexer.match("b")).success).toBe(false);
    expect((await regexer.match("rbr")).success).toBe(true);
    expect((await regexer.match("rr")).success).toBe(false);
    expect((await regexer.match("ggrrab")).success).toBe(true);

    regexer.clear();
});

test("option 2", async () => {
    const regexer = new Regexer("a|(rb+r)");

    expect((await regexer.match("a")).success).toBe(true);
    expect((await regexer.match("b")).success).toBe(false);
    expect((await regexer.match("rbr")).success).toBe(true);
    expect((await regexer.match("rr")).success).toBe(false);
    expect((await regexer.match("ggrrab")).success).toBe(true);

    regexer.clear();
});

test("complex match (option, iteration, group)", async () => {
    const regexer = new Regexer("t(a|(rb+r)|dd)+t");

    expect((await regexer.match("a")).success).toBe(false);
    expect((await regexer.match("tt")).success).toBe(false);
    expect((await regexer.match("tat")).success).toBe(true);
    expect((await regexer.match("tddt")).success).toBe(true);
    expect((await regexer.match("tarbraddt")).success).toBe(true);
    expect((await regexer.match("abrtrbrarbraddta")).success).toBe(true);
    expect((await regexer.match("trbbbbrt")).success).toBe(true);
    expect((await regexer.match("trbabbbrt")).success).toBe(false);
    expect((await regexer.match("tddaddrb")).success).toBe(false);

    regexer.clear();
});

test("SOS (start of string)", async () => {
    const regexer = new Regexer("^a");

    expect((await regexer.match("a")).success).toBe(true);
    expect((await regexer.match("ta")).success).toBe(false);
    expect((await regexer.match("taaat")).success).toBe(false);
    expect((await regexer.match("tttta")).success).toBe(false);
    expect((await regexer.match("attttbttt")).success).toBe(true);

    regexer.clear();
});

test("EOS (end of string)", async () => {
    const regexer = new Regexer("a$");

    expect((await regexer.match("a")).success).toBe(true);
    expect((await regexer.match("ta")).success).toBe(true);
    expect((await regexer.match("taaat")).success).toBe(false);
    expect((await regexer.match("tttta")).success).toBe(true);
    expect((await regexer.match("attttbttt")).success).toBe(false);

    regexer.clear();
});

test("SOS + EOS (with option)", async () => {
    const regexer = new Regexer("^(a)+|b+$");

    expect((await regexer.match("a")).success).toBe(true);
    expect((await regexer.match("ta")).success).toBe(false);
    expect((await regexer.match("taaat")).success).toBe(false);
    expect((await regexer.match("tttta")).success).toBe(false);
    expect((await regexer.match("attttbtttb")).success).toBe(true);
    expect((await regexer.match("ab")).success).toBe(true);
    expect((await regexer.match("ttttb")).success).toBe(true);
    expect((await regexer.match("gabg")).success).toBe(false);
    expect((await regexer.match("ba")).success).toBe(false);

    regexer.clear();
});

test("\\w\\W (equivalent: [_0-9a-zA-Z][^_0-9a-zA-Z])", async () => {
    const regexer = new Regexer("\\w\\W");

    expect((await regexer.match("a-")).success).toBe(true);
    expect((await regexer.match("_.")).success).toBe(true);
    expect((await regexer.match("2§")).success).toBe(true);
    expect((await regexer.match("B>")).success).toBe(true);
    expect((await regexer.match("aa")).success).toBe(false);
    expect((await regexer.match("a0")).success).toBe(false);
    expect((await regexer.match("a_")).success).toBe(false);
    expect((await regexer.match("aH")).success).toBe(false);
    expect((await regexer.match(".(")).success).toBe(false);
    expect((await regexer.match("+0")).success).toBe(false);
    expect((await regexer.match(" 0")).success).toBe(false);

    regexer.clear();
});

test("\\d\\D (equivalent: [0-9][^0-9])", async () => {
    const regexer = new Regexer("\\d\\D");

    expect((await regexer.match("a-")).success).toBe(false);
    expect((await regexer.match("09")).success).toBe(false);
    expect((await regexer.match("00")).success).toBe(false);
    expect((await regexer.match("0a")).success).toBe(true);
    expect((await regexer.match("4*")).success).toBe(true);
    expect((await regexer.match("1(")).success).toBe(true);
    expect((await regexer.match("0\x00")).success).toBe(true);
    expect((await regexer.match("7!")).success).toBe(true);
    expect((await regexer.match("ga")).success).toBe(false);

    regexer.clear();
});

test("\\s\\S (equivalent: [\\t\\n\\v\\f\\r \\xA0][^\\t\\n\\v\\f\\r \\xA0])", async () => {
    const regexer = new Regexer("\\s\\S");

    expect((await regexer.match("  ")).success).toBe(false);
    expect((await regexer.match(" \n")).success).toBe(false);
    expect((await regexer.match("\n\t")).success).toBe(false);
    expect((await regexer.match("\na")).success).toBe(true);
    expect((await regexer.match("\t0")).success).toBe(true);
    expect((await regexer.match(" g")).success).toBe(true);
    expect((await regexer.match("\f'")).success).toBe(true);
    expect((await regexer.match("\xA0_")).success).toBe(true);
    expect((await regexer.match("\v\v")).success).toBe(false);
    expect((await regexer.match("\v\xFF")).success).toBe(true);

    regexer.clear();
});

test("escaped ascii \\[0tnvrf]", async () => {
    const regexer = new Regexer("\0\t\n\v\r\f");

    expect((await regexer.match("\0\t\n\v\r\f")).success).toBe(true);

    regexer.clear();
});

test("list", async () => {
    const regexer = new Regexer("[abc]");

    expect((await regexer.match("a")).success).toBe(true);
    expect((await regexer.match("dddb")).success).toBe(true);
    expect((await regexer.match("ddcd")).success).toBe(true);
    expect((await regexer.match("abc")).success).toBe(true);
    expect((await regexer.match("ggdq")).success).toBe(false);

    regexer.clear();
});

test("list hex", async () => {
    const regexer = new Regexer("[\x00\x01]");

    expect((await regexer.match("\x00")).success).toBe(true);
    expect((await regexer.match("\x01")).success).toBe(true);
    expect((await regexer.match("aaa\x01bb")).success).toBe(true);
    expect((await regexer.match("\x02")).success).toBe(false);

    regexer.clear();
});

test("list range", async () => {
    const regexer = new Regexer("[\x00-z]");

    expect((await regexer.match("\x05")).success).toBe(true);
    expect((await regexer.match("\x04")).success).toBe(true);
    expect((await regexer.match("g")).success).toBe(true);
    expect((await regexer.match("~")).success).toBe(false);
    expect((await regexer.match("\xAA")).success).toBe(false);

    regexer.clear();
});

test("list negated", async () => {
    const regexer = new Regexer("[^a-zA-Z]");

    expect((await regexer.match("056")).success).toBe(true);
    expect((await regexer.match("-")).success).toBe(true);
    expect((await regexer.match("(")).success).toBe(true);
    expect((await regexer.match("g")).success).toBe(false);
    expect((await regexer.match("Z")).success).toBe(false);

    regexer.clear();
});

test("list iteration", async () => {
    const regexer = new Regexer("_[a-zA-Z]*_");

    expect((await regexer.match("_abcde_")).success).toBe(true);
    expect((await regexer.match("_ABCdeZghl_")).success).toBe(true);
    expect((await regexer.match("012__")).success).toBe(true);
    expect((await regexer.match("_ghtw0eg_")).success).toBe(false);
    expect((await regexer.match("_*_")).success).toBe(false);

    regexer.clear();
});

