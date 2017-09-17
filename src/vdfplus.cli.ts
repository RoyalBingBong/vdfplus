#! /usr/bin/env node

import VDF = require("./vdfplus")

import { readFileSync, writeFileSync, existsSync } from "fs"
import { join, extname, isAbsolute, dirname } from "path"

import * as cmd from "commander"
import * as mkdirp from "mkdirp"

const { version } = require("../package.json")

// workaround, see: https://github.com/tj/commander.js/issues/564
cmd._name = "vdfplus"
cmd
  .version(version)
  .usage("[options] <input> <output>")
  .option("-j, --json", "VDF to JSON (default behaviur)")
  .option("-v, --vdf", "JSON to VDF")
  .option("-o, --out <file>", "output to <file>")
  .option(
    "-i, --indentation <charornumber>",
    "indentation for the output. number or whitespace characters. defaults to 2 spaces"
  )
  .option(
    "-s, --seperator <char>",
    "space between key-value pairs (VDF only). defaults to '\\t'"
  )
  .option("-e, --encoding <encoding>", "encoding of hte input file. defaults to 'utf8'")
  .option("-n, --notypes", "disable JSON types. all values will be strings")

cmd.parse(process.argv)

if (cmd.args.length == 0) {
  console.error(`No input specified. Pass a file or use "-" to allow piping`)
  cmd.help()
  process.exit(1)
}

// Commander defaults
cmd.json = cmd.json || true
cmd.encoding = cmd.encoding || "utf8"
cmd.seperator = cmd.seperator || "\t"
if (cmd.seperator) {
  cmd.seperator = cmd.seperator.replace(/\\t/g, "\t")
} else {
  cmd.seperator = "\t"
}
if (cmd.indentation) {
  if (/\d/.test(cmd.indentation)) {
    cmd.indentation = parseInt(cmd.indentation)
  } else {
    cmd.indentation = cmd.indentation.replace(/\\t/g, "\t")
  }
} else {
  cmd.indentation = 2
}

let types = cmd.notypes != undefined ? false : true

let [infile, outfile] = cmd.args
outfile = outfile || cmd.out

let pipein = infile == "-"
let pipeout = outfile == undefined
// not piping, input does not exist
if (!pipein && !checkFile(infile)) {
  console.error(`Could not find file: "${infile}"`)
  process.exit()
}
// no pipe, so we read the file
// console.error("pipein", pipein)
if (!pipein) {
  let input = readFile(infile, cmd.encoding)
  processInput(input)
} else {
  // read from stdin
  let input = ""
  process.stdin.on("data", chunk => {
    input += chunk
  })
  process.stdin.on("end", () => {
    processInput(input)
  })
}

function processInput(inputdata: string) {
  let data
  if (cmd.vdf) {
    data = toVDF(inputdata)
  } else {
    data = toJSON(inputdata)
  }
  if (!pipeout) {
    saveTo(outfile, data, cmd.encoding)
    process.exit()
  } else {
    process.stdout.write(data)
    process.exit()
  }
}

function readFile(file: string, encoding: string) /*:string */ {
  return readFileSync(file, encoding)
}

function checkFile(file: string): boolean {
  file = pathCheck(file)
  return existsSync(file)
}

function saveTo(file: string, data: string, encoding: string): void {
  file = pathCheck(file)
  mkdirp.sync(dirname(file))
  writeFileSync(file, data, encoding)
}

function pathCheck(file: string): string {
  if (!isAbsolute(file)) {
    file = join(process.cwd(), file)
  }
  return file
}

function toJSON(input: string): string {
  try {
    let vdfobj = VDF.parse(input, types)
    return JSON.stringify(vdfobj, null, cmd.indentation)
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}

function toVDF(input: string): string {
  try {
    let json = JSON.parse(input)
    return VDF.stringify(json, cmd.indentation, cmd.seperator)
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
