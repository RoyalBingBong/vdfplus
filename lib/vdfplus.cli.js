#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VDF = require("./vdfplus");
const fs_1 = require("fs");
const path_1 = require("path");
const cmd = require("commander");
const mkdirp = require("mkdirp");
const { version } = require("../package.json");
// workaround, see: https://github.com/tj/commander.js/issues/564
cmd._name = "vdfplus";
cmd
    .version(version)
    .usage("[options] <input> <output>")
    .option("-j, --json", "VDF to JSON (default behavior)")
    .option("-v, --vdf", "JSON to VDF")
    .option("-d, --indentation <char or number>", "indentation for the VDF/JSON. number or whitespace characters. defaults to 2 spaces")
    .option("-s, --separator <char>", "space between VDF key-value pairs. defaults to '\\t'")
    .option("-e, --encoding <encoding>", "encoding of input. defaults to 'utf8'")
    .option("-o, --output-encoding <encoding>", "encoding of the output. defaults to 'utf8'")
    .option("-n, --no-types", "disable JSON types. all values will be strings");
cmd.parse(process.argv);
if (cmd.args.length == 0) {
    console.error(`No input specified. Pass an input file or use "-" to enable piping in data`);
    cmd.help();
    process.exit(1);
}
// Commander defaults
cmd.json = cmd.json || true;
cmd.encoding = cmd.encoding || "utf8";
cmd.outputEncoding = cmd.outputEncoding || "utf8";
cmd.indentation = typeof cmd.indentation == "string" ? cmd.indentation : 2;
if (cmd.separator) {
    if (/\d+/.test(cmd.separator)) {
        cmd.separator = parseInt(cmd.separator);
    }
    else {
        cmd.separator = cmd.separator.replace(/\\t/g, "\t");
    }
}
else {
    cmd.separator = "\t";
}
if (typeof cmd.indentation == "string") {
    if (/\d+/.test(cmd.indentation)) {
        cmd.indentation = parseInt(cmd.indentation);
    }
    else if (cmd.indentation == "") {
        cmd.indentation = null;
    }
    else {
        cmd.indentation = cmd.indentation.replace(/\\t/g, "\t");
    }
}
let types = cmd.noTypes != undefined ? false : true;
let [inFile, outFile] = cmd.args;
let pipeIn = inFile == "-";
let pipeOut = outFile == undefined;
// not piping, input does not exist
if (!pipeIn && !checkFile(inFile)) {
    console.error(`Could not find file: "${inFile}"`);
    process.exit();
}
// no pipe, so we read the file
if (!pipeIn) {
    let input = readFile(inFile, cmd.encoding);
    processInput(input);
}
else {
    // read from stdin
    let input = "";
    process.stdin.on("data", chunk => {
        input += chunk;
    });
    process.stdin.on("end", () => {
        let encodedInput = Buffer.from(input).toString(cmd.encoding);
        processInput(encodedInput);
    });
}
function processInput(inputData) {
    let data;
    if (cmd.vdf) {
        data = toVDF(inputData, cmd.indentation, cmd.separator);
    }
    else {
        data = toJSON(inputData, cmd.indentation);
    }
    if (!pipeOut) {
        saveTo(outFile, data, cmd.outputEncoding);
        process.exit();
    }
    else {
        let encodedData = Buffer.from(data).toString(cmd.outputEncoding);
        process.stdout.write(data);
        process.exit();
    }
}
function readFile(file, encoding) {
    return fs_1.readFileSync(file, encoding);
}
function checkFile(file) {
    file = pathCheck(file);
    return fs_1.existsSync(file);
}
function saveTo(file, data, encoding) {
    file = pathCheck(file);
    mkdirp.sync(path_1.dirname(file));
    fs_1.writeFileSync(file, data, encoding);
}
function pathCheck(file) {
    if (!path_1.isAbsolute(file)) {
        file = path_1.join(process.cwd(), file);
    }
    return file;
}
function toJSON(input, indentation) {
    try {
        let vdf = VDF.parse(input, types);
        return JSON.stringify(vdf, null, indentation);
    }
    catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
function toVDF(input, indentation, sep) {
    try {
        let json = JSON.parse(input);
        if (indentation == null) {
            indentation = "";
        }
        return VDF.stringify(json, indentation, sep);
    }
    catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
