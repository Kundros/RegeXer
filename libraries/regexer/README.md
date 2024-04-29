# Regexer - regex parser library for match history

## Introduction

This library is part of thesis at VSB-TUO by Dominik Kundra.
Main goal of this library is to implement executable regex (with integrated parser), that can be executed against string and returns history of matching. This tool can be used for example for debugging purposes, optimization purposes and/or visualization purposes. 

*Note: this project might not be full-fledged.*

<br>

## Environment

This library is made for browser-like and node environment. If you're planning using this library, in browser environments you may need embed the built file as a blob if you don't want to deal with cors, if you're using webpack you may use custom-worker-loader.js in src/loaders directory with following usage:

*add following code to your module: { rules: [] } section in webpack config*
```js
{
    test: /\.(js|ts)$/,
    use: [
        {
            loader: path.resolve('path/to/custom-worker-loader.js'),
            options: {
                target: "web"
            },
        }
    ],
}
```
*valid targets: web | node*

<br>

## Setup

If you're building this library on your own, you'll need to have installed npm along with node.js.

Download npm packages using command below in library root:
```bash
npm install --save-dev
```

To build project simply use command below in library root:
```bash
npm run build
```

<br>

## Integrated parsing functionality
**Regexes used in code examples are presented in javascript 
regex notation.**

### **Stringify**
    
```js
/abcd/
```
*Note: set/stream of characters that must be follow each other in order.* 

### **Option**

```js
/a|b|c/
```
*Note: an option in this case between 3 characters **a** or **b** or **c***

### **Groups**

```js
/(a)(?:a)(?<name>)/
```
*Note: anything between 2 brackets enclosed (string: "a")* 

(**default** - capturing, "?:" - non capturing, "?\<name\>" - named )

## **Iteration**

```js
/a*b+c*?/
```
*Note: iteration of one element* 

("\*" - zero or more, "\+" - one or more, "{from,to}" - range iterations)

### **List**

```js
/[a-zA-Z\xA0-\xFF]/
```
*Note: match one from any of listed characters.*

("a-z" - range from **a** to **z**)

### **Optional**
```js
/a?/
```
*Note: match element or ignore it.*

### **End of string**
```js
/$/
```
*Note: match must be at the end of the string.*

### **Start of string**
```js
/^/
```
*Note: match must be at the start of the string.*

### **Escaped characters**

#### **Regex reserved**

```js
/\(\#\\/
```
*Note: escaped character that would be otherwise evaluated as part of regex special character.*

#### **Special**

```js
/\w\W\d\D\s\S/
```
list notation equivalent:
* \w = **[_0-9a-zA-Z]**
* \W = **[^_0-9a-zA-Z]**
* \d = **[0-9]**
* \D = **[^0-9]**
* \s = **[\t\n\v\f\r \xA0]**
* \S = **[^\t\n\v\f\r \xA0]**

*Note: matches character from its list equivalent.* 

#### **Ascii**

```js
/\0\t\n\v\r\f/
```
*Note: ascii equivalent escaped character.*

#### **Hexadecimal**
```js
/\x00\xFF/
```
format in regex notation:

> \\x[0-9a-fA-F]{2}

*Note: matches character from ascii table of it's corresponding number position*

<br>

## About matching
    
Matching string to parsed regex is done by using threads.js which allows for both web worker and worker thread usage for browser-like and node environment respectively.

Matching creates match structure (all patterns are not implemented), which can be used for many applications, the structure should be sort of history how was match found and what operations regex had to do. The structure in now returned either as batch (small portion of final match), or as the final match with assigned prototype to it. The batch variant is useful for async loading when the match structure could be potentially too big.

Matching is done against parsed NFA (non-deterministic finite automata), which is returned from parser (used peggy for context-free grammar), the additional information to match is added from AST (abstract syntax tree), which is also part of parsed structure.



    