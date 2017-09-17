(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.VDF = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
const TYPEEX = {
    INT: /^\d+$/,
    FLOAT: /^\d+\.\d+$/,
    BOOLEAN: /true|false/i
};
function parse(str, types = true) {
    if (typeof str != "string") {
        throw new TypeError(`Expecting parameter to be string, received ${typeof str}`);
    }
    return _parse(str, types, 1);
}
function _parse(str, types = true, currentLine) {
    let obj = {};
    let line = currentLine || 1; // we start at one boys
    let openBracket = false;
    let bracketCount = 0;
    let openQuote = false;
    let startComment = false;
    let potentialComment = false;
    let globalBrackets = 0;
    let globalQuotes = 0;
    let expectKey = true;
    let expectValue = false;
    let currentKey = "";
    let currentValue = "";
    for (let i = 0; i < str.length; i++) {
        let char = str[i];
        if (char == '"') {
            if (!openBracket) {
                // Allow escaped qutoes inside tokens
                if (str[i - 1] && str[i - 1] == "\\") {
                    if (expectKey) {
                        currentKey += char;
                    }
                    if (expectValue) {
                        currentValue += char;
                    }
                    continue;
                }
                if (!openQuote) {
                    openQuote = true;
                    globalQuotes++;
                }
                else {
                    openQuote = false;
                    globalQuotes--;
                    if (expectKey) {
                        expectKey = false;
                        expectValue = true;
                        continue;
                    }
                    if (expectValue) {
                        expectKey = true;
                        expectValue = false;
                        if (types) {
                            if (TYPEEX.INT.test(currentValue)) {
                                currentValue = parseInt(currentValue);
                            }
                            else if (TYPEEX.FLOAT.test(currentValue)) {
                                currentValue = parseFloat(currentValue);
                            }
                            else if (TYPEEX.BOOLEAN.test(currentValue)) {
                                currentValue = currentValue.toLowerCase() == "true";
                            }
                        }
                        if (currentKey in obj) {
                            if (Array.isArray(obj[currentKey])) {
                                obj[currentKey].push(currentValue);
                            }
                            else {
                                obj[currentKey] = [obj[currentKey], currentValue];
                            }
                        }
                        else {
                            obj[currentKey] = currentValue;
                        }
                        currentKey = "";
                        currentValue = "";
                    }
                }
                continue;
            }
        }
        if (char == "{") {
            if (!openQuote) {
                bracketCount++;
                globalBrackets++;
                if (expectKey) {
                    /**
                     * value-token just closed with } or "
                     * looking for key-token
                     * get
                     */
                    throw new SyntaxError(`Unexpected token '${char}' at line ${line}"`);
                }
                if (expectValue && !openBracket) {
                    openBracket = true;
                    continue;
                }
                if (!expectValue) {
                    continue;
                }
            }
        }
        if (char == "}") {
            if (!openQuote) {
                bracketCount--;
                globalBrackets--;
                if (openBracket && bracketCount == 0) {
                    openBracket = false;
                    if (expectValue) {
                        let value = _parse(currentValue, types, line);
                        // Duplicate keys get merged into an array
                        if (currentKey in obj) {
                            if (Array.isArray(obj[currentKey])) {
                                obj[currentKey].push(value);
                            }
                            else {
                                obj[currentKey] = [obj[currentKey], value];
                            }
                        }
                        else {
                            obj[currentKey] = value;
                        }
                        currentKey = "";
                        currentValue = "";
                        expectKey = true;
                        expectValue = false;
                    }
                }
                if (!expectValue) {
                    continue;
                }
            }
        }
        if (char == "\n") {
            line++;
            if (startComment) {
                startComment = false;
            }
            // if(openQuote) {
            //   throw new SyntaxError(`Unexpected line break at line ${line}. Missing quotation to close token"`)
            // }
        }
        if (expectKey && openQuote) {
            currentKey += char;
            continue;
        }
        if (expectValue && (openQuote || openBracket)) {
            currentValue += char;
            continue;
        }
        if (char == "/") {
            if (!openQuote || !openBracket) {
                if (startComment) {
                    continue;
                }
                if (!potentialComment) {
                    potentialComment = true;
                    continue;
                }
                if (str[i - 1] && str[i - 1] == "/") {
                    potentialComment = false;
                    startComment = true;
                    continue;
                }
            }
        }
    }
    if (globalBrackets > 0) {
        let bracket = (globalBrackets > 1 ? "brackets" : "bracket");
        throw new SyntaxError(`VDF seems to be malformed. Found ${globalBrackets} unclosed ${bracket}.`);
    }
    if (globalQuotes > 0) {
        let quote = (globalBrackets > 1 ? "quotes" : "quote");
        throw new SyntaxError(`VDF seems to be malformed. Found ${globalQuotes} unclosed ${quote}.`);
    }
    return obj;
}
function stringify(value, space, seperator) {
    if (!value || typeof value != "object") {
        throw new TypeError(`Expected object got ${typeof value}`);
    }
    let stack = [];
    let indent = "";
    let gap = "";
    if (!space) {
        gap = "  ";
    }
    else if (typeof space == "number") {
        gap = "".padStart(space);
    }
    else if (typeof space == "string") {
        if (!/^\s+$/.test(space)) {
            throw new TypeError("space has to be a string containing only whitespace characters");
        }
        gap = space.substring(0, 10);
    }
    if (!seperator) {
        seperator = "\t";
    }
    else {
        if (!/^\s+$/.test(seperator)) {
            throw new TypeError("seperator has to be a string containing only whitespace characters");
        }
    }
    let datobject = {};
    datobject[""] = value;
    return serialize("", datobject, gap, indent, seperator);
}
function serialize(key, obj, whitespace, indentation, seperator) {
    let value = obj[key];
    let prefix = indentation;
    indentation += whitespace;
    if (typeof value != "object") {
        return quote("" + value);
    }
    else {
        let results = [];
        for (let subkey in value) {
            if (Array.isArray(value[subkey])) {
                let arr = value[subkey];
                for (let i = 0; i < arr.length; i++) {
                    let elem = serialize(i, arr, whitespace, indentation, seperator);
                    if (typeof arr[i] == "object") {
                        results.push(`${quote(subkey)}${whitespace}{\n${indentation}${elem}\n${prefix}}`);
                    }
                    else {
                        results.push(`${quote(subkey)}${whitespace}${elem}`);
                    }
                }
            }
            else if (typeof value[subkey] == "object") {
                let elem = serialize(subkey, value, whitespace, indentation, seperator);
                results.push(`${quote(subkey)}${whitespace}{\n${indentation}${elem}\n${prefix}}`);
            }
            else {
                let elem = serialize(subkey, value, whitespace, indentation, seperator);
                results.push(`${quote(subkey)}${"\t"}${elem}`);
            }
        }
        return results.join(`\n${prefix}`);
    }
}
function quote(str) {
    return `"${str}"`;
}
module.exports = {
    parse: parse,
    stringify: stringify
};

},{}]},{},[1])(1)
});