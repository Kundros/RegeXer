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


test("test 'null' iteration infinite loop 1", async () => {
    const regexer = new Regexer();
    await regexer.parse("()+");

    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match("Z"))[0].success).toBe(true);
    expect((await regexer.match("ZaaaBCD"))[0].success).toBe(true);

    regexer.clear();
});

test("test 'null' iteration infinite loop 2", async () => {
    const regexer = new Regexer();
    await regexer.parse("()*");

    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match("Z"))[0].success).toBe(true);
    expect((await regexer.match("ZaaaBCD"))[0].success).toBe(true);

    regexer.clear();
});

test("test 'null' iteration infinite loop 3", async () => {
    const regexer = new Regexer();
    await regexer.parse("(a|b|)*");

    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match("abbbc"))[0].success).toBe(true);
    expect((await regexer.match("gabbbdcdddd"))[0].success).toBe(true);

    regexer.clear();
});

test("test nested 'null' iteration infinite loop", async () => {
    const regexer = new Regexer();
    await regexer.parse("((a|b|()+)*|a|b|)+");

    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match("abbbc"))[0].success).toBe(true);
    expect((await regexer.match("gabbbdcdddd"))[0].success).toBe(true);

    regexer.clear();
});

test("nested non 'null' iteration infinite loop wierd scenario", async () => {
    const regexer = new Regexer();
    await regexer.parse('(ab(c)*)+_');

    let match = (await regexer.match('abab_'))[0];
    expect(match.start).toBe(0);
    expect(match.end).toBe(5);

    match = (await regexer.match('abababab_'))[0];
    expect(match.start).toBe(0);
    expect(match.end).toBe(9);

    match = (await regexer.match('abcabababcccc_'))[0];
    expect(match.start).toBe(0);
    expect(match.end).toBe(14);

    regexer.clear();
});

test("optional 1", async () => {
    const regexer = new Regexer();
    await regexer.parse('(ab)?');

    expect((await regexer.match("ab"))[0].success).toBe(true);
    expect((await regexer.match(""))[0].success).toBe(true);

    regexer.clear();
});

test("optional 2", async () => {
    const regexer = new Regexer();
    await regexer.parse('(ab)?a');

    expect((await regexer.match("ab"))[0].success).toBe(true);
    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match(""))[0].success).toBe(false);
    expect((await regexer.match("bbbbabbb"))[0].success).toBe(true);

    regexer.clear();
});

test("optional 3", async () => {
    const regexer = new Regexer();
    await regexer.parse('(?:(a+|b+)+)?');

    expect((await regexer.match("ab"))[0].success).toBe(true);
    expect((await regexer.match("a"))[0].success).toBe(true);
    expect((await regexer.match(""))[0].success).toBe(true);
    expect((await regexer.match("bbbbabbb"))[0].success).toBe(true);

    regexer.clear();
});

test("iteration range 1", async () => {
    const regexer = new Regexer();
    await regexer.parse('a{3}');

    expect((await regexer.match("aaa"))[0].success).toBe(true);
    expect((await regexer.match("aab"))[0].success).toBe(false);
    expect((await regexer.match("bbbabaab"))[0].success).toBe(false);
    expect((await regexer.match("bbbaaab"))[0].success).toBe(true);
    expect((await regexer.match("bbbaaaaaab"))[0].success).toBe(true);
    expect((await regexer.match("aaaaaaaa"))[0].success).toBe(true);
    expect((await regexer.match(""))[0].success).toBe(false);

    regexer.clear();
});

test("iteration range 2", async () => {
    const regexer = new Regexer();
    await regexer.parse('a{3,}');

    expect((await regexer.match("aaa"))[0].success).toBe(true);
    expect((await regexer.match("aab"))[0].success).toBe(false);
    expect((await regexer.match("bbbabaab"))[0].success).toBe(false);
    expect((await regexer.match("bbbaaab"))[0].success).toBe(true);
    expect((await regexer.match("bbbaaaaaab"))[0].success).toBe(true);
    expect((await regexer.match(""))[0].success).toBe(false);

    const match = (await regexer.match("baaaaaaaab"))[0];

    expect(match.success).toBe(true);
    expect(match.start).toStrictEqual(1);
    expect(match.end).toStrictEqual(9);

    regexer.clear();
});

test("iteration range 3", async () => {
    const regexer = new Regexer();
    await regexer.parse('^a{3,6}$');

    expect((await regexer.match("aaa"))[0].success).toBe(true);
    expect((await regexer.match("aab"))[0].success).toBe(false);
    expect((await regexer.match("bbbabaab"))[0].success).toBe(false);
    expect((await regexer.match("bbbaaab"))[0].success).toBe(false);
    expect((await regexer.match("bbbaaaaaab"))[0].success).toBe(false);
    expect((await regexer.match("aaaaaa"))[0].success).toBe(true);
    expect((await regexer.match("aaaaaaa"))[0].success).toBe(false);

    regexer.clear();
});

test("iteration range complex 1", async () => {
    const regexer = new Regexer();
    await regexer.parse('^(a|b|(x+)){3,9}$');

    expect((await regexer.match("aaa"))[0].success).toBe(true);
    expect((await regexer.match("aab"))[0].success).toBe(true);
    expect((await regexer.match("bbbabaab"))[0].success).toBe(true);
    expect((await regexer.match("bbbaaab"))[0].success).toBe(true);
    expect((await regexer.match("bbbaaaaaab"))[0].success).toBe(false);
    expect((await regexer.match("aaaaaa"))[0].success).toBe(true);
    expect((await regexer.match("aaaaaaa"))[0].success).toBe(true);
    expect((await regexer.match("axxxxxxbxxxxxaxxxxxxbxxb"))[0].success).toBe(true);
    expect((await regexer.match("axxxxxxbxxxxxaxxxxxxbxxbxxxx"))[0].success).toBe(false);
    expect((await regexer.match("xxx"))[0].success).toBe(true);

    regexer.clear();
});

test("iteration range complex 2", async () => {
    const regexer = new Regexer();
    await regexer.parse('^(a{2,}|b{3}|(x+)){3,9}$');

    expect((await regexer.match("aaa"))[0].success).toBe(false);
    expect((await regexer.match("aab"))[0].success).toBe(false);
    expect((await regexer.match("bbbabaab"))[0].success).toBe(false);
    expect((await regexer.match("bbbaababbb"))[0].success).toBe(false);
    expect((await regexer.match("bbbaaab"))[0].success).toBe(false);
    expect((await regexer.match("bbbaaaab"))[0].success).toBe(false);
    expect((await regexer.match("bbbaaaabbb"))[0].success).toBe(true);
    expect((await regexer.match("bbbaaaaaa"))[0].success).toBe(true);
    expect((await regexer.match("aaaaaa"))[0].success).toBe(true);
    expect((await regexer.match("aaaaaaa"))[0].success).toBe(true);
    expect((await regexer.match("axxxxxxbxxxxxaxxxxxxbxxb"))[0].success).toBe(false);
    expect((await regexer.match("axxxxxxbxxxxxaxxxxxxbxxbxxxx"))[0].success).toBe(false);
    expect((await regexer.match("aaxxxx"))[0].success).toBe(true);
    expect((await regexer.match("aaaxxxx"))[0].success).toBe(true);
    expect((await regexer.match("aaaxxbxx"))[0].success).toBe(false);
    expect((await regexer.match("aaaxxaxx"))[0].success).toBe(false);
    expect((await regexer.match("xxx"))[0].success).toBe(true);

    regexer.clear();
});

test("iteration range complex 3", async () => {
    const regexer = new Regexer();
    await regexer.parse('^(\\+ ?\\d{3} ?)?(\\d{3} ?){3}$');

    expect((await regexer.match("aaa"))[0].success).toBe(false);
    expect((await regexer.match("aab"))[0].success).toBe(false);
    expect((await regexer.match("bbbabaab"))[0].success).toBe(false);
    expect((await regexer.match("+420"))[0].success).toBe(false);
    expect((await regexer.match("+420123456"))[0].success).toBe(false);
    expect((await regexer.match("420123456"))[0].success).toBe(true);
    expect((await regexer.match("420 123456"))[0].success).toBe(true);
    expect((await regexer.match("420 123 456"))[0].success).toBe(true);
    expect((await regexer.match("+421 420 123 456"))[0].success).toBe(true);
    expect((await regexer.match("+421420 123456"))[0].success).toBe(true);
    expect((await regexer.match("+123420123456"))[0].success).toBe(true);
    expect((await regexer.match("+123420123456 "))[0].success).toBe(true);
    expect((await regexer.match(" +123420123456"))[0].success).toBe(false);
    expect((await regexer.match("+ 123420123456"))[0].success).toBe(true);
    expect((await regexer.match("+ 111 111111 111"))[0].success).toBe(true);
    expect((await regexer.match("+ 111 111111 1111"))[0].success).toBe(false);
    expect((await regexer.match("+ 111 111111 111122"))[0].success).toBe(false);
    expect((await regexer.match("+ 111 111 111 111 122"))[0].success).toBe(false);
    expect((await regexer.match("+111111111111122"))[0].success).toBe(false);

    regexer.clear();
});

test("iteration range complex 4", async () => {
    const regexer = new Regexer();
    await regexer.parse('^(\\+ ?\\d{3})?( ?\\d{3}){3}$');

    expect((await regexer.match("aaa"))[0].success).toBe(false);
    expect((await regexer.match("aab"))[0].success).toBe(false);
    expect((await regexer.match("bbbabaab"))[0].success).toBe(false);
    expect((await regexer.match("+420"))[0].success).toBe(false);
    expect((await regexer.match("+420123456"))[0].success).toBe(false);
    expect((await regexer.match("420123456"))[0].success).toBe(true);
    expect((await regexer.match("420 123456"))[0].success).toBe(true);
    expect((await regexer.match("420 123 456"))[0].success).toBe(true);
    expect((await regexer.match("+421 420 123 456"))[0].success).toBe(true);
    expect((await regexer.match("+421420 123456"))[0].success).toBe(true);
    expect((await regexer.match("+123420123456"))[0].success).toBe(true);
    expect((await regexer.match("+123420123456 "))[0].success).toBe(false);
    expect((await regexer.match("+123 420 123 456 "))[0].success).toBe(false);
    expect((await regexer.match("420 123 456 "))[0].success).toBe(false);
    expect((await regexer.match("+420 123 456"))[0].success).toBe(false);

    regexer.clear();
});