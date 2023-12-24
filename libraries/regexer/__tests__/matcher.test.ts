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