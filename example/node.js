import vdfplus from "vdfplus"
import {readFileSync, writeFileSync} from "fs"


// It is important to use the proper encoding
let vdfFile = readFileSync("test/testfiles/test.vdf", "utf8")

// Parse VDF string
let vdf = VDF.parse(vdffile)

// Change data
vdf["anewrootkey"] = {
    "foo": "bar",
    "baz": [
        1, 2, 3, 4, 5
    ]
}

// Stringify the changes to vdf, indent using tabs and seperate pairs with two spaces
let str = VDF.stringify(vdf, "\t", "  ")

// Save file
writeFileSync("test/testfiles/test.vdf", "utf8")