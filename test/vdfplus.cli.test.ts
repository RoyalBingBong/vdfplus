import { spawn } from "child_process"
import { join } from "path"
import { createReadStream, readFileSync, existsSync } from "fs"
import * as test from "tape"
import * as rimraf from "rimraf"
import VDF = require("../lib/vdfplus")

const { version } = require("../package.json")
const outputDirectory = join(__dirname, "out")
const vdftestfile = join(__dirname, "testfiles", "test.vdf")
const jsontestfile = join(__dirname, "testfiles", "test.json")
const clijs = join(__dirname, "..", "lib", "vdfplus.cli.js")

test("cli", t => {
  t.plan(1)
  let vdfplus = spawn(process.argv[0], [clijs, "-V"])

  vdfplus.stdout.on("data", chunk => {
    let cliversion = chunk.toString().trim()
    t.equal(cliversion, version)
    t.end()
  })
})

test("cli - pipe vdf in, pipe json out", t => {
  t.plan(2)
  let vdfplus = spawn(process.argv[0], [clijs, "-"])
  let vdfRead = createReadStream(vdftestfile, "utf8")

  vdfRead.pipe(vdfplus.stdin)
  vdfplus.stdout.on("data", chunk => {
    let jsonstr = chunk.toString()
    let json = JSON.parse(jsonstr)
    let [key1, key2] = Object.keys(json)
    t.equal(key1, "FirstRootKey")
    t.equal(key2, "SecondRootKey")
  })
  vdfplus.stderr.on("data", err => {
    t.fail(err.toString())
  })
  vdfplus.on("close", () => {
    t.end()
  })
})

test("cli - pipe vdf in, json file out", t => {
  t.plan(1)
  let outfile = join(outputDirectory, "out.json")
  let vdfplus = spawn(process.argv[0], [clijs, "-", outfile])
  let vdfRead = createReadStream(vdftestfile, "utf8")
  vdfRead.pipe(vdfplus.stdin)

  vdfplus.on("close", () => {
    let outExists = existsSync(outfile)
    t.equals(outExists, true)
    t.end()
  })
  vdfplus.stdout.on("data", data => {
    console.log("stdout", data.toString())
    // t.fail(data.toString())
  })
  vdfplus.stderr.on("data", err => {
    console.log("stderr", err.toString())
    // t.fail(err.toString())
  })
})

test("cli - json file in, vdf file out", t => {
  t.plan(1)
  let outfile = join(outputDirectory, "out.vdf")
  let vdfplus = spawn(process.argv[0], [clijs, "-v", jsontestfile, outfile])

  // vdfplus.stderr.on("data", err => {
  //   t.fail(err.toString())
  // })
  vdfplus.on("close", () => {
    let outExists = existsSync(outfile)
    t.equals(outExists, true)
    t.end()
  })
})

test("cli - invalid format", t => {
  t.plan(1)
  let outfile = join(outputDirectory, "out.vdf")
  let vdfplus = spawn(process.argv[0], [clijs, jsontestfile, outfile])

  vdfplus.stderr.on("data", err => {
    let message = err.toString().trim()
    t.equal(message, "Unexpected token { in VDF in line 1")
    t.end()
  })
})

test.onFinish(() => {
  rimraf.sync(outputDirectory)
})
