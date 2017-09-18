import vdfplus from "vdfplus"
import { readFileSync, writeFileSync } from "fs"

// It is important to use the proper encoding, e.g. some language files in Dota2 are UTF16, so you have to use "ucs2" to read the file properly
let vdfFile = readFileSync("test/testfiles/test.vdf", "utf8")

// Parse VDF string
let vdf = VDF.parse(vdfFile)

// Change data
vdf["a-new-root-key"] = {
  foo: "bar",
  baz: [1, 2, 3, 4, 5],
}

// Stringify the changes to vdf, indent using tabs and separate pairs with two spaces
let str = VDF.stringify(vdf, "\t", "  ")

// Save file
writeFileSync("test/testfiles/test.vdf", "utf8")
