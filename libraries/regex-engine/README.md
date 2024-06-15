# Regex engine library with matching history

## Introduction

This library implements executable regex (with integrated parser).
Main objective of this library is to create structure (history of matching) that can be used for many purposes. This tool can be used for example for debugging purposes, optimization purposes and/or visualization purposes. 

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

## Functionality
- Parsing regular expressions (limited syntax)
    - JavaScript syntax
- Matching against parsed regex (limited)
    - Creates structure of states (history of matching)
    - Matching runs on separate thread (NodeJS or browser)
    - Can return whole match at once or in batches

<br>

## Setup

If you're building this library on your own, you'll need to have installed npm along with node.js.

Download npm packages using command below in library root:
```bash
npm install
```

To build project simply use command below in library root:
```bash
npm run build
```

<br>

## Integrated parsing functionality
Parsing now only applies for JavaScript's regexes, and **"should"** be correct, however this project cannot guarantee that, and should be taken with caution. Also not whole standard of Regexes is implemented yet. Please if you find any bugs or missmatches report it on this github repository.

### **String**
    
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

### **Iteration**

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


    