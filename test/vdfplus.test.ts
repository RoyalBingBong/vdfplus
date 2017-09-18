import { join } from "path"
import { readFileSync } from "fs"

import * as test from "tape"

import VDF = require("../lib/vdfplus")
const vdftestfile = join(__dirname, "testfiles", "test.vdf")
const ti2017vdffile = join(
  __dirname,
  "testfiles",
  "ti7_compendium_caster_list.txt"
)

const vdftestdata = readFileSync(vdftestfile, "utf8")
const vdfti2017data = readFileSync(ti2017vdffile, "utf8")



test("parse", t => {
  t.plan(3)
  let obj = VDF.parse(vdftestdata)
  let [key1, key2] = Object.keys(obj)
  t.equal(Object.keys(obj).length, 2)
  t.equal(key1, "FirstRootKey")
  t.equal(key2, "SecondRootKey")
  t.end()
})

test("parse - types", t => {
  t.plan(3)
  let obj = VDF.parse(vdftestdata)
  let types = obj["FirstRootKey"].types
  t.equal(types.int, 1234)
  t.equal(types.float, 12.123123)
  t.equal(types.boolean, true)
  t.end()
})

test("parse - no type casts", t => {
  t.plan(3)
  let obj = VDF.parse(vdftestdata, false)
  let types = obj["FirstRootKey"].types
  t.equal(types.int, "1234")
  t.equal(types.float, "12.123123")
  t.equal(types.boolean, "true")
  t.end()
})

test("parse - arrayification", t => {
  t.plan(1)
  let obj = VDF.parse(vdfti2017data)
  let english = obj["ti7_compendium_caster_list.txt"]["english"]["0"]
  t.equal(english.length, 28)
  t.end()
})

test("stringify", t => {
  t.plan(1)
  let obj = VDF.parse(vdftestdata)
  let stringified = VDF.stringify(obj)
  t.notEqual(stringified, "")
})

test("deterministic", t => {
  t.plan(1)
  let pass1 = VDF.parse(vdftestdata)
  let stringified = VDF.stringify(pass1)
  let pass2 = VDF.parse(vdftestdata)
  t.deepEqual(pass1, pass2)
  t.end()
})
