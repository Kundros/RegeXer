# Regexer - regex parser library for match history

## Introduction

This library is part of thesis at VSB-TUO by Dominik Kundra.
Main goal of this library is to implement executable regex (with integrated parser), that can be executed against string and returns history of matching. This tool can be used for example for debugging puproses, optimalisation purposes and/or visualisation purposes. 

*Note: this project might not be full-fledged.*

<br>

## Enviroment

This library is primarly made for node enviroment compatible with ESM and CJS. Currently for browser enviroments some functionality, such as matching isn't working and will throw errors.

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

("\*" - zero or more, "\+" - one or more, "\*?" - lazy quantifier **[match least characters]**)

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

*Note: matches character from ascii table of it's coresponding number position*

<br>

## About matching
    
Matching string to parsed regex is done using worker thread in node enviroment, the **browser version isn't functional yet thus don't plan to use matching on browser until functionality done otherwise you would get errors**. 

Matching creates match structure (isn't fully done yet), which can be used for many applications, the structure should be sort of history how was match found and what operations regex had to do. **The structure isn't standardized and will probably change later for more polished version.**

Matching is done agains't parsed NFA (non-deterministic finite automata), which is returned from parser (used peggy for context-free grammar), the aditional information to match is added from AST (abstract syntax tree), which is also part of parsed structure.



    