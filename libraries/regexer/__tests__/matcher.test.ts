import { test, expect } from '@jest/globals';

import { Regexer } from '../src/core/Regexer';

global.__filename = "dist/cjs/core/Regexer";

test("empty", async () => {
    const regexer = new Regexer();
    await regexer.parse();

    expect((await regexer.match(""))[0].success).toBe(true);
    expect((await regexer.match("aaa"))[0].success).toBe(true);
    expect((await regexer.match("487512rewfff)fef"))[0].success).toBe(true);

    regexer.clear();
});

test("one character", async () => {
    const regexer = new Regexer();
    await regexer.parse("a");

    expect((await regexer.match(""))[0].success).toBe(false);
    expect((await regexer.match("aaa"))[0].success).toBe(true);
    expect((await regexer.match("djrkdajmkt"))[0].success).toBe(true);
    expect((await regexer.match("djrkd1jmkt"))[0].success).toBe(false);
    expect((await regexer.match("d"))[0].success).toBe(false);

    regexer.clear();
});

test("string character", async () => {
    const regexer = new Regexer();
    await regexer.parse("test");

    expect((await regexer.match(""))[0].success).toBe(false);
    expect((await regexer.match("aaab"))[0].success).toBe(false);
    expect((await regexer.match("test"))[0].success).toBe(true);
    expect((await regexer.match("aaatest"))[0].success).toBe(true);
    expect((await regexer.match("aatesaaa"))[0].success).toBe(false);
    expect((await regexer.match("aatastaaa"))[0].success).toBe(false);

    regexer.clear();
});

test("iteration character zero or more", async () => {
    const regexer = new Regexer();
    await regexer.parse("a*");

    expect((await regexer.match(""))[0].success).toBe(true);
    expect((await regexer.match("aaab"))[0].success).toBe(true);
    expect((await regexer.match("bb"))[0].success).toBe(true);
    expect((await regexer.match("aaaaaatest"))[0].success).toBe(true);

    regexer.clear();
});

test("iteration character one or more", async () => {
    const regexer = new Regexer();
    await regexer.parse("a+");

    expect((await regexer.match(""))[0].success).toBe(false);
    expect((await regexer.match("aaab"))[0].success).toBe(true);
    expect((await regexer.match("bb"))[0].success).toBe(false);
    expect((await regexer.match("aaaaaatest"))[0].success).toBe(true);

    regexer.clear();
});

test("iteration surounded zero or more", async () => {
    const regexer = new Regexer();
    await regexer.parse("ba*r");

    expect((await regexer.match("br"))[0].success).toBe(true);
    expect((await regexer.match("baaar"))[0].success).toBe(true);
    expect((await regexer.match("babar"))[0].success).toBe(true);
    expect((await regexer.match("tbaataaaartest"))[0].success).toBe(false);
    expect((await regexer.match("a"))[0].success).toBe(false);
    expect((await regexer.match("tar"))[0].success).toBe(false);

    regexer.clear();
});

test("iteration surounded one or more", async () => {
    const regexer = new Regexer();
    await regexer.parse("ba+r");

    expect((await regexer.match("br"))[0].success).toBe(false);
    expect((await regexer.match("baaar"))[0].success).toBe(true);
    expect((await regexer.match("babar"))[0].success).toBe(true);

    regexer.clear();
});

test("iteration group surounded 1", async () => {
    const regexer = new Regexer();
    await regexer.parse("b(ab)+r");

    expect((await regexer.match("ab"))[0].success).toBe(false);
    expect((await regexer.match("babr"))[0].success).toBe(true);
    expect((await regexer.match("babar"))[0].success).toBe(false);
    expect((await regexer.match("bababr"))[0].success).toBe(true);
    expect((await regexer.match("br"))[0].success).toBe(false);

    regexer.clear();
});

test("iteration group surounded 2", async () => {
    const regexer = new Regexer();
    await regexer.parse("b(ab)*r");

    expect((await regexer.match("ab"))[0].success).toBe(false);
    expect((await regexer.match("bar"))[0].success).toBe(false);
    expect((await regexer.match("bababr"))[0].success).toBe(true);
    expect((await regexer.match("br"))[0].success).toBe(true);

    regexer.clear();
});

test("option", async () => {
    const regexer = new Regexer();
    await regexer.parse("a|b");

    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match("b"))[0].success).toBe(true);
    expect((await regexer.match("c"))[0].success).toBe(false);
    expect((await regexer.match("cdrabr"))[0].success).toBe(true);

    regexer.clear();
});

test("option 2", async () => {
    const regexer = new Regexer();
    await regexer.parse("a|(rb+r)");

    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match("b"))[0].success).toBe(false);
    expect((await regexer.match("rbr"))[0].success).toBe(true);
    expect((await regexer.match("rr"))[0].success).toBe(false);
    expect((await regexer.match("ggrrab"))[0].success).toBe(true);

    regexer.clear();
});

test("complex match (option, iteration, group)", async () => {
    const regexer = new Regexer();
    await regexer.parse("t(a|(rb+r)|dd)+t");

    expect((await regexer.match("a"))[0].success).toBe(false);
    expect((await regexer.match("tt"))[0].success).toBe(false);
    expect((await regexer.match("tat"))[0].success).toBe(true);
    expect((await regexer.match("tddt"))[0].success).toBe(true);
    expect((await regexer.match("tarbraddt"))[0].success).toBe(true);
    expect((await regexer.match("abrtrbrarbraddta"))[0].success).toBe(true);
    expect((await regexer.match("trbbbbrt"))[0].success).toBe(true);
    expect((await regexer.match("trbabbbrt"))[0].success).toBe(false);
    expect((await regexer.match("tddaddrb"))[0].success).toBe(false);

    regexer.clear();
});

test("SOS (start of string)", async () => {
    const regexer = new Regexer();
    await regexer.parse("^a");

    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match("ta"))[0].success).toBe(false);
    expect((await regexer.match("taaat"))[0].success).toBe(false);
    expect((await regexer.match("tttta"))[0].success).toBe(false);
    expect((await regexer.match("attttbttt"))[0].success).toBe(true);

    regexer.clear();
});

test("EOS (end of string)", async () => {
    const regexer = new Regexer();
    await regexer.parse("a$");

    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match("ta"))[0].success).toBe(true);
    expect((await regexer.match("taaat"))[0].success).toBe(false);
    expect((await regexer.match("tttta"))[0].success).toBe(true);
    expect((await regexer.match("attttbttt"))[0].success).toBe(false);

    regexer.clear();
});

test("SOS + EOS (with option)", async () => {
    const regexer = new Regexer();
    await regexer.parse("^(a)+|b+$");

    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match("ta"))[0].success).toBe(false);
    expect((await regexer.match("taaat"))[0].success).toBe(false);
    expect((await regexer.match("tttta"))[0].success).toBe(false);
    expect((await regexer.match("attttbtttb"))[0].success).toBe(true);
    expect((await regexer.match("ab"))[0].success).toBe(true);
    expect((await regexer.match("ttttb"))[0].success).toBe(true);
    expect((await regexer.match("gabg"))[0].success).toBe(false);
    expect((await regexer.match("ba"))[0].success).toBe(false);

    regexer.clear();
});

test("\\w\\W (equivalent: [_0-9a-zA-Z][^_0-9a-zA-Z])", async () => {
    const regexer = new Regexer();
    await regexer.parse("\\w\\W");

    expect((await regexer.match("a-"))[0].success).toBe(true);
    expect((await regexer.match("_."))[0].success).toBe(true);
    expect((await regexer.match("2§"))[0].success).toBe(true);
    expect((await regexer.match("B>"))[0].success).toBe(true);
    expect((await regexer.match("aa"))[0].success).toBe(false);
    expect((await regexer.match("a0"))[0].success).toBe(false);
    expect((await regexer.match("a_"))[0].success).toBe(false);
    expect((await regexer.match("aH"))[0].success).toBe(false);
    expect((await regexer.match(".("))[0].success).toBe(false);
    expect((await regexer.match("+0"))[0].success).toBe(false);
    expect((await regexer.match(" 0"))[0].success).toBe(false);

    regexer.clear();
});

test("\\d\\D (equivalent: [0-9][^0-9])", async () => {
    const regexer = new Regexer();
    await regexer.parse("\\d\\D");

    expect((await regexer.match("a-"))[0].success).toBe(false);
    expect((await regexer.match("09"))[0].success).toBe(false);
    expect((await regexer.match("00"))[0].success).toBe(false);
    expect((await regexer.match("0a"))[0].success).toBe(true);
    expect((await regexer.match("4*"))[0].success).toBe(true);
    expect((await regexer.match("1("))[0].success).toBe(true);
    expect((await regexer.match("0\x00"))[0].success).toBe(true);
    expect((await regexer.match("7!"))[0].success).toBe(true);
    expect((await regexer.match("ga"))[0].success).toBe(false);

    regexer.clear();
});

test("\\s\\S (equivalent: [\\t\\n\\v\\f\\r \\xA0][^\\t\\n\\v\\f\\r \\xA0])", async () => {
    const regexer = new Regexer();
    await regexer.parse("\\s\\S");

    expect((await regexer.match("  "))[0].success).toBe(false);
    expect((await regexer.match(" \n"))[0].success).toBe(false);
    expect((await regexer.match("\n\t"))[0].success).toBe(false);
    expect((await regexer.match("\na"))[0].success).toBe(true);
    expect((await regexer.match("\t0"))[0].success).toBe(true);
    expect((await regexer.match(" g"))[0].success).toBe(true);
    expect((await regexer.match("\f'"))[0].success).toBe(true);
    expect((await regexer.match("\xA0_"))[0].success).toBe(true);
    expect((await regexer.match("\v\v"))[0].success).toBe(false);
    expect((await regexer.match("\v\xFF"))[0].success).toBe(true);

    regexer.clear();
});

test("escaped ascii \\[0tnvrf]", async () => {
    const regexer = new Regexer();
    await regexer.parse("\0\t\n\v\r\f");

    expect((await regexer.match("\0\t\n\v\r\f"))[0].success).toBe(true);

    regexer.clear();
});

test("list", async () => {
    const regexer = new Regexer();
    await regexer.parse("[abc]");

    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match("dddb"))[0].success).toBe(true);
    expect((await regexer.match("ddcd"))[0].success).toBe(true);
    expect((await regexer.match("abc"))[0].success).toBe(true);
    expect((await regexer.match("ggdq"))[0].success).toBe(false);

    regexer.clear();
});

test("list hex", async () => {
    const regexer = new Regexer();
    await regexer.parse("[\x00\x01]");

    expect((await regexer.match("\x00"))[0].success).toBe(true);
    expect((await regexer.match("\x01"))[0].success).toBe(true);
    expect((await regexer.match("aaa\x01bb"))[0].success).toBe(true);
    expect((await regexer.match("\x02"))[0].success).toBe(false);

    regexer.clear();
});

test("list range", async () => {
    const regexer = new Regexer();
    await regexer.parse("[\x00-z]");

    expect((await regexer.match("\x05"))[0].success).toBe(true);
    expect((await regexer.match("\x04"))[0].success).toBe(true);
    expect((await regexer.match("g"))[0].success).toBe(true);
    expect((await regexer.match("~"))[0].success).toBe(false);
    expect((await regexer.match("\xAA"))[0].success).toBe(false);

    regexer.clear();
});

test("list negated", async () => {
    const regexer = new Regexer();
    await regexer.parse("[^a-zA-Z]");

    expect((await regexer.match("056"))[0].success).toBe(true);
    expect((await regexer.match("-"))[0].success).toBe(true);
    expect((await regexer.match("("))[0].success).toBe(true);
    expect((await regexer.match("g"))[0].success).toBe(false);
    expect((await regexer.match("Z"))[0].success).toBe(false);

    regexer.clear();
});

test("list iteration", async () => {
    const regexer = new Regexer();
    await regexer.parse("_[a-zA-Z]*_");

    expect((await regexer.match("_abcde_"))[0].success).toBe(true);
    expect((await regexer.match("_ABCdeZghl_"))[0].success).toBe(true);
    expect((await regexer.match("012__"))[0].success).toBe(true);
    expect((await regexer.match("_ghtw0eg_"))[0].success).toBe(false);
    expect((await regexer.match("_*_"))[0].success).toBe(false);

    regexer.clear();
});


test("any symbol", async () => {
    const regexer = new Regexer();
    await regexer.parse(".");

    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match("Z"))[0].success).toBe(true);
    expect((await regexer.match("("))[0].success).toBe(true);
    expect((await regexer.match("~"))[0].success).toBe(true);
    expect((await regexer.match("\n"))[0].success).toBe(false);
    expect((await regexer.match("\r"))[0].success).toBe(false);
    expect((await regexer.match("\r%"))[0].success).toBe(true);

    regexer.clear();
});
