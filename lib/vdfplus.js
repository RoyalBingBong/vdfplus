"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TYPEEX = {
    INT: /^\d+$/,
    FLOAT: /^\d+\.\d+$/,
    BOOLEAN: /true|false/i,
};
/**
 * Convert a VDF string into a JavaScript Object
 *
 * @param {string} str VDF string that will be parsed into an object
 * @param {boolean} [types=true]  Set data type casting
 * @returns {object} Resulting object
 */
function parse(str, types = true) {
    if (typeof str != "string") {
        throw new TypeError(`Expecting parameter to be string, received ${typeof str}`);
    }
    return _parse(str, types, 1);
}
exports.parse = parse;
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
                // Allow escaped quotes inside tokens
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
                     */
                    throw new SyntaxError(`Unexpected token ${char} in VDF in line ${line}`);
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
    /**
     * Things have to "check out" before we return the object
     */
    if (globalBrackets > 0) {
        let bracket = globalBrackets > 1 ? "brackets" : "bracket";
        throw new SyntaxError(`VDF seems to be malformed. Found ${globalBrackets} unclosed ${bracket}.`);
    }
    if (globalQuotes > 0) {
        let quote = globalBrackets > 1 ? "quotes" : "quote";
        throw new SyntaxError(`VDF seems to be malformed. Found ${globalQuotes} unclosed ${quote}.`);
    }
    return obj;
}
/**
 * Convert a JavaScript object to a VDF string
 *
 * @param {*} value A JavaScript object to be converted
 * @param {(number | string)} [indentation=2] Indentation of whitespace characters. Accepts numbers or a string containing whitespace characters. Strings longer than 10 characters will be cut off. If an empty string is passed, the output will omit line breaks
 * @param {string} [separator="\t"] Separator character in between key-value pairs. Accepts number or a string containing whitespace characters.
 * @returns
 */
function stringify(value, indentation, separator) {
    if (!value || typeof value != "object") {
        throw new TypeError(`Expected object got ${typeof value}`);
    }
    let stack = [];
    let indent = "";
    let gap, sep;
    let lineBreak = "\n";
    if (typeof indentation == "number") {
        gap = "".padStart(Math.min(indentation, 10));
    }
    else if (typeof indentation == "string") {
        // Empty string, omit line breaks
        if (indentation == "") {
            lineBreak = " ";
            gap = " ";
        }
        else if (!/^\s+$/.test(indentation)) {
            throw new TypeError("indentation has to be a string containing only whitespace characters");
        }
        else {
            gap = indentation.substring(0, 10);
        }
    }
    else {
        gap = "  ";
    }
    if (typeof separator == "number") {
        sep = "".padStart(Math.min(separator, 10));
    }
    else if (typeof separator == "string") {
        if (!/^\s+$/.test(separator)) {
            throw new TypeError("separator has to be a string containing only whitespace characters");
        }
        else {
            sep = separator;
        }
    }
    else {
        sep = "\t";
    }
    let dataObject = {};
    dataObject[""] = value;
    // console.log(`gap "${gap}", indent "${indent}", separator "${separator}", lineBreak "${lineBreak}", `)
    return serialize("", dataObject, gap, indent, sep, lineBreak);
}
exports.stringify = stringify;
// a bit like JSON.stringify spec
function serialize(key, obj, whitespace, indentation, separator, linebreak) {
    let value = obj[key];
    let prefix = indentation;
    indentation += whitespace;
    if (typeof value != "object") {
        return quote("" + value);
    }
    else {
        let results = [];
        for (let subKey in value) {
            if (Array.isArray(value[subKey])) {
                let arr = value[subKey];
                for (let i = 0; i < arr.length; i++) {
                    let elem = serialize(i, arr, whitespace, indentation, separator, linebreak);
                    if (typeof arr[i] == "object") {
                        results.push(`${quote(subKey)}${whitespace}{${linebreak}${indentation}${elem}${linebreak}${prefix}}`);
                    }
                    else {
                        results.push(`${quote(subKey)}${separator}${elem}`);
                    }
                }
            }
            else if (typeof value[subKey] == "object") {
                let elem = serialize(subKey, value, whitespace, indentation, separator, linebreak);
                results.push(`${quote(subKey)}${separator}{${linebreak}${indentation}${elem}${linebreak}${prefix}}`);
            }
            else {
                let elem = serialize(subKey, value, whitespace, indentation, separator, linebreak);
                results.push(`${quote(subKey)}${separator}${elem}`);
            }
        }
        return results.join(`${linebreak}${prefix}`);
    }
}
function quote(str) {
    return `"${str}"`;
}
