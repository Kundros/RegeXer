import { test, expect } from '@jest/globals';

import { Compiler } from '../src/models/Compiler';
import { RegexString } from '../src/models/regexNFA/RegexString';
import { RegexOption } from '../src/models/regexNFA/RegexOption';
import { RegexCapturing } from '../src/models/regexNFA/RegexCapturing';

test('empty', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("");
    expect(compiledRegex.next).toBe(undefined);
});

test('string of characters', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("abcd");

    const element = compiledRegex.next;
    expect(element).toBeInstanceOf(RegexString);

    expect((<RegexString>element).string).toEqual("abcd");
});

test('string of characters and escaped characters', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("abcd\\n\\r\\(");

    const element = compiledRegex.next;
    expect(element).toBeInstanceOf(RegexString);

    expect((<RegexString>element).string).toEqual("abcd\\n\\r\\(");
});

test('test simple option', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("a|b");

    const element = compiledRegex.next;
    expect(element).toBeInstanceOf(RegexOption);

    const options = (<RegexOption>element).options;

    expect(options.length).toEqual(2);
    expect((<RegexString>options[0]).string).toEqual("a");
    expect((<RegexString>options[1]).string).toEqual("b");
});

test('test complex option', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("a|b|ca|daaba|d");

    const element1 = compiledRegex.next;
    expect(element1).toBeInstanceOf(RegexOption);
    
    const element2 = element1.next;
    expect(element2).toBeInstanceOf(RegexOption);

    const element3 = element2.next;
    expect(element3).toBeInstanceOf(RegexString);

    const element4 = element3.next;
    expect(element4).toBeInstanceOf(RegexOption);

    expect((<RegexString>element3).string).toEqual("aab");

    const options = (<RegexOption>element1).options;

    expect(options.length).toEqual(3);
    expect((<RegexString>options[0]).string).toEqual("a");
    expect((<RegexString>options[1]).string).toEqual("b");
    expect((<RegexString>options[2]).string).toEqual("c");
});

test('capturing group 1', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("(a|b)");

    const element = compiledRegex.next;
    expect(element).toBeInstanceOf(RegexCapturing);

    expect((<RegexCapturing>element).next).toEqual(undefined);
    expect((<RegexCapturing>element).rootCapture).toBeInstanceOf(RegexOption);
});

test('capturing group 2', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("(a|b)(a)");

    const element = compiledRegex.next;
    expect(element).toBeInstanceOf(RegexCapturing);
    const element2 = element.next;
    expect(element2).toBeInstanceOf(RegexCapturing);

    expect((<RegexCapturing>element2).rootCapture.next).toEqual(undefined);
    expect((<RegexCapturing>element2).rootCapture).toBeInstanceOf(RegexString);
});

test('capturing group 3', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("()((a)(a(a)))");

    const element = compiledRegex.next;
    expect(element).toBeInstanceOf(RegexCapturing);

    const element2 = element.next;
    expect(element2).toBeInstanceOf(RegexCapturing);

    expect((<RegexCapturing>element2).rootCapture).toBeInstanceOf(RegexCapturing);

    const element2_2 = (<RegexCapturing>element2).rootCapture.next;

    expect(element2_2).toBeInstanceOf(RegexCapturing);
    expect((<RegexCapturing>element2_2).rootCapture).toBeInstanceOf(RegexString);
    expect((<RegexCapturing>element2_2).rootCapture.next).toBeInstanceOf(RegexCapturing);
});

test('capturing group combined with option', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("()|(b())|a");

    const element = compiledRegex.next;
    expect(element).toBeInstanceOf(RegexOption);

    const options = (<RegexOption>element).options;
    expect(options[0]).toBeInstanceOf(RegexCapturing);
    expect(options[1]).toBeInstanceOf(RegexCapturing);
    expect(options[2]).toBeInstanceOf(RegexString);

    expect((<RegexCapturing>options[0]).rootCapture).toBe(undefined);
    expect((<RegexCapturing>options[1]).rootCapture).toBeInstanceOf(RegexString);
    expect((<RegexString>options[2]).string).toBe("a");
});