import { test, expect } from '@jest/globals';

import { Compiler } from '../src/models/Compiler';
import { RegexString } from '../src/models/regexNFA/RegexString';
import { RegexOption } from '../src/models/regexNFA/RegexOption';

test('string of characters', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("abcd");

    const element = compiledRegex.getNext();
    expect(element).toBeInstanceOf(RegexString);

    expect((<RegexString>element).string).toEqual("abcd");
});

test('string of characters and escaped characters', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("abcd\\n\\r\\(");

    const element = compiledRegex.getNext();
    expect(element).toBeInstanceOf(RegexString);

    expect((<RegexString>element).string).toEqual("abcd\\n\\r\\(");
});

test('test simple option', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("a|b");

    const element = compiledRegex.getNext();
    expect(element).toBeInstanceOf(RegexOption);

    const options = (<RegexOption>element).getOptions();

    expect(options.length).toEqual(2);
    expect((<RegexString>options[0]).string).toEqual("a");
    expect((<RegexString>options[1]).string).toEqual("b");
});

test('test complex option', () => {
    const compiler = new Compiler();
    const compiledRegex = compiler.compile("a|b|ca|daaba|d");

    const element1 = compiledRegex.getNext();
    expect(element1).toBeInstanceOf(RegexOption);
    
    const element2 = element1.getNext();
    expect(element2).toBeInstanceOf(RegexOption);

    const element3 = element2.getNext();
    expect(element3).toBeInstanceOf(RegexString);

    const element4 = element3.getNext();
    expect(element4).toBeInstanceOf(RegexOption);

    expect((<RegexString>element3).string).toEqual("aab");
    expect((<RegexString>element3).string).toEqual("aab");

    const options = (<RegexOption>element1).getOptions();

    expect(options.length).toEqual(3);
    expect((<RegexString>options[0]).string).toEqual("a");
    expect((<RegexString>options[1]).string).toEqual("b");
    expect((<RegexString>options[2]).string).toEqual("c");
});