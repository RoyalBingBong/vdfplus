# vdfplus
`vdfplus` is a small library that aims to help with converting Valve's [KeyValue](https://developer.valvesoftware.com/wiki/KeyValues) format to JSON and vice versa. `vdfplus` is special in that it "arrayifies" key-tokens that appear multiple times in the `.vdf`, e.g. Steam Controller configurations. Per default tt also casts values into their respective data type.  
`vdfplus` can be used with node, in the browser or via command-line

# Installation

### For your project:  

    npm install vdfplus

### For the CLI feature:

    npm install vdfplus -g

# API
VDF exposes two functions `parse` and `stringify`. They are derived from the `JSON.parse` and `JSON.stringify`.

## `VDF.parse(str:string, types?:boolean)`
Parses a VDF string into a Javascript object
- `str` is a VDF string that will be parsed into an object.
- `types` (_Optional_) sets the type casting of the VDF values, it defaults to `true`


## `VDF.stringify(obj:object, indentation?:number|string, seperator:string)`
Stringifies an object to VDF.
- `object`: The object that will be stringified into VDF.  
- `indentation` (_Optional_): Sets the indentation of the string. If a number N is passed, then indentation will be N spaces. If a string is passed, then indentation will be that string. Defaults to `2`.
- `seperator` (_Optional_): Sets the whitespace between key-value pairs. Defaults to `\t`


# Usage
## Import
### node
```js
const vdfplus = require("vdfplus")
// or ES6
import vdfplus from "vdfplus"
```
### Browser

```html
<script src="node_modules/vdfplus/lib/vdfplus.web.js"></script>
<!-- OR -->
<script src="node_modules/vdfplus/lib/vdfplus.web.min.js"></script>
```
## Example
### Node
Read file (sync), parse the VDF into an object, modify obect, stringify object and save to file (sync).
```js
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
```
### Browser
The API is the same in the browser. `vdfplus` supports UMD, so you can use whatever import method you want, if you don't then vdfplus will just be exported as a global `VDF`


## CLI
`vdfplus` can also be used via command-line.
```bash
  Usage: vdfplus [options] <input> <output>

  Options:

    -V, --version                    output the version number
    -j, --json                       VDF to JSON (default behaviur)
    -v, --vdf                        JSON to VDF
    -o, --out <file>                 output to <file>
    -i, --indentation <charornumber>  indentation for the output. number or whitespace characters. defaults to 2 spaces
    -s, --seperator <char>           space between key-value pairs (VDF only). defaults to '\t'
    -e, --encoding                   encoding of hte input file. defaults to 'utf8'
    -n, --notypes                    disable JSON types. all values will be strings
    -h, --help                       output usage information
```

### Example
Simply VDF to JSON:

```bash
vdfplus input.vdf output.vdf
```
Piping:
```bash
# stdin, file out
echo "foo" { "bar" "baz" } | vdfplus - result.json
# stdin, stdout
echo "foo" { "bar" "baz" } | vdfplus -
# file in, stdout
vdfplus result.json -v
```
Formatting
```bash
# create vdf, indent with tabs and use two spaces between pairs
vdfplus input.json output.vdf -v -i \t -s "  "
```

