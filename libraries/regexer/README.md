# Regexer - regex compiler library

## Introduction

This library is part of thesis at VSB-TUO by Dominik Kundra.
Main goal of this library is to implement executable regex with integrated compilation that can be executed step by step. This tool can be used for debugging puproses and optimalisation purposes. 

*Note: this project might not be full-fledged.*

## Setup

If you're building this library for your own, you'll need to have installed npm along with node.js.

To build project simply use command below in library root:
```bash
npm run build
```
Download npm packages using command below in library root:
```bash
npm install --save-dev
```

## Integrated functionality
**Regexes used in code examples are presented in javascript 
regex notation.**

* Stringify 
    ```js
    /abcd/
    ```
    *Note: set/stream of characters that must be follow each other in order.* 

* Escaped Character
    ```js
    /\(\#\\/
    ```
    *Note: escaped character that would be otherwise evaluated as part of regex special character.*

### TODO:

*when compiling and state stack isn't empty at the end of compilation, then the regex input was invalid.*