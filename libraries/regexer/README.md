# Regexer - regex compiler library

## Introduction

This library is part of thesis at VSB-TUO by Dominik Kundra.
Main goal of this library is to implement executable regex (with integrated parser), that can be executed step by step. This tool can be used for debugging puproses and optimalisation purposes. 

*Note: this project might not be full-fledged.*

## Setup

If you're building this library on your own, you'll need to have installed npm along with node.js.

To build project simply use command below in library root:
```bash
npm run build
```
Download npm packages using command below in library root:
```bash
npm install --save-dev
```

## Integrated parsing functionality
**Regexes used in code examples are presented in javascript 
regex notation.**

* **Stringify**
    ```js
    /abcd/
    ```
    *Note: set/stream of characters that must be follow each other in order.* 

* **Escaped Character**
    ```js
    /\(\#\\/
    ```
    *Note: escaped character that would be otherwise evaluated as part of regex special character.*

* **Option**
    ```js
    /a|b|c/
    ```
    *Note: an option in this case between 3 characters **a** or **b** or **c***

* **Groups**
    ```js
    /(a)(?:a)(?<name>)/
    ```
    *Note: anything between 2 brackets enclosed (string: "a")* 

    (**default** - capturing, "?:" - non capturing, "?\<name\>" - named )

* **Iteration**
    ```js
    /a*b+c*?/
    ```
    *Note: iteration of one element* 

    ("\*" - zero or more, "\+" - one or more, "\*?" - lazy quantifier **[match least characters]**)

* **List**
    ```js
    /[a-zA-Z\xA0-\xFF]/
    ```
    *Note: match one from any of listed characters.*

    ("a-z" - range from **a** to **z**)

* **Optional**
    ```js
    /a?/
    ```
    *Note: match element or ignore it.*