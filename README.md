<div align="center">
    <h1>Regex visualisation extension for vscode</h1>
    <div align="center">
        <img src="https://img.shields.io/badge/npm-v0.0.1-0172b3.svg" alt="npm">
        <img src="https://img.shields.io/badge/typescript-v5.2.2-3178c6.svg" alt="typescript">
    </div>
</div>

## Introduction

This project is root for **regex visualisation extension for visual studio**. Its purpose is to give programers tool built in vscode to debug regular expressions in real time. Also this whole project is part of Thesis at VSB-TUO, by Dominik Kundra. All parts of this extension could be not fully-fledged so please take that in concideration. Now this extension can only recognise limited number of regular expressions, and only regular expressions for ECMAScript (JavaScript) specification. The parts that are not implemented, but might be in future are mainly lookarounds.

## Setup

If you're building this library on your own, you'll need to have installed npm along with node.js.

Download npm packages using command below in root:
```bash
npm install --save-dev
```

To build project simply use command below in root:
```bash
npm run build
```