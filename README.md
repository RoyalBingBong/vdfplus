# vdfplus
vdfplus is a small library that aims to help with converting Valve's [KeyValue](https://developer.valvesoftware.com/wiki/KeyValues) format to JSON and vice versa. vdfplus is special in that it "arrayifies" key-tokens that appear multiple times in the `.vdf`, e.g. Steam Controller configurations. Per default tt also tries to casts values-tokens into their respective data type.  
vdfplus can be used with nodejs, in the browser or via command-line.

# Installation

### For your project:  

    npm install vdfplus

### For the CLI feature:

    npm install vdfplus -g

# API
VDF exposes two functions `parse` and `stringify`. They are derived from the `JSON.parse` and `JSON.stringify`.

### `VDF.parse(str:string, types?:boolean)`
Parses a VDF string into a JavaScript object
| Parameter | Type | Description | default |
| --- | --- | --- | :---: |
| `str` | `string` | A VDF string that will be parsed into an object. | -
| `types` | `boolean` | (_Optional_) Sets the data type casting of the VDF values |  `true`|

<!-- - `str`: A VDF string that will be parsed into an object.
- `types` (_Optional_): Sets the data type casting of the VDF values, defaults to `true` -->


### `VDF.stringify(obj:object, indentation?:number|string, separator?:string)`
Stringifies an object to VDF.

| Parameter | Type | Description | default |
| --- |--- | --- | :---: |
| `object` | `object` | Object that will be stringified into VDF. | - |
| `indentation` | `number|string` | (_Optional_): Indentation of the string. Number of spaces or a string of whitespace characters. If an empty string is passed, then line breaks will be disabled | `2` |
| `separator` | `number|string` |(_Optional_): Whitespace between key-value pairs. Number of spaces or a string of whitespace characters | `\t` |


<!-- - `object`: The object that will be stringified into VDF.  
- `indentation` (_Optional_): Sets the indentation of the string. If a number N is passed, then indentation will be N spaces. If a string is passed, then indentation will be that string. Defaults to `2`.
- `separator` (_Optional_): Sets the whitespace between key-value pairs. Defaults to `\t` -->


# Usage
## Library
### node.js
```js
const vdfplus = require("vdfplus")
// or ES6
import vdfplus from "vdfplus"
```
### Browser
```html
<script src="node_modules/vdfplus/lib/vdfplus.web.js"></script>
<!-- OR minified-->
<script src="node_modules/vdfplus/lib/vdfplus.web.min.js"></script>
```
vdfplus is using UMD for exports It supports most common module loaders in the browser or simply adds a global namespace `VDF` if no loader is present.
### Example
- Read file or get the text from a textarea
- Parse the VDF into an object
- Modify object
- Stringify object
- Save to file or fill textarea with JSON string
```js
// It is important to use the proper encoding
let vdfRaw = readFileSync("test/testfiles/test.vdf", "utf8")
// or read from textarea
let vdfRaw = document.getElementById("vdf-text").value

// Parse VDF string
let vdf = VDF.parse(vdfRaw)

// Change data
vdf["a-new-root-key"] = {
    "foo": "bar",
    "baz": [
        1, 2, 3, 4, 5
    ]
}

// Stringify the changes to vdf, indent using tabs and separate pairs with two spaces
let str = VDF.stringify(vdf, "\t", "  ")

// Save file
writeFileSync("test/testfiles/test.vdf", "utf8")
// or write to textarea
document.getElementById("json-text").value = str
```

## CLI
vdfplus can also be used via command-line. Per default vdfplus parses VDF to JSON, so adding `-j` or `--json` s not needed! Data can be piped in via `stdin` and will be piped out to `stdout` if no uutput file was specified.  
`indentation` is used for VDF and for JSON (defaults to 2 spaces [`"  "`]), `separate` only relevant for VDF (defaults to tabs [`\t`]). Per default `vdfplus` will try to cast value-tokens into their respective data types. `encoding` and `output-encoding` are only for files
```
Usage: vdfplus [options] <input> <output>

Options:
    -V, --version                       output the version number
    -j, --json                          VDF to JSON (default behavior)
    -v, --vdf                           JSON to VDF
    -d, --indentation <char or number>  indentation for the VDF/JSON. number or whitespace characters. defaults to 2 spaces
    -s, --separator <char>              space between VDF key-value pairs. defaults to '\t'
    -e, --encoding <encoding>           encoding of input. defaults to 'utf8'
    -o, --output-encoding <encoding>    encoding of the output. defaults to 'utf8'
    -n, --no-types                       disable JSON types. all values will be strings
    -h, --help                          output usage information
```

### Example
Simple VDF to JSON conversion:
```sh
$ vdfplus input.vdf output.vdf
```
Simple JSON to VDF conversion:
```sh
$ vdfplus -v input.vdf output.vdf
```


Piping:
```sh
# stdin, file out
$ echo "foo" { "bar" "baz" } | vdfplus - result.json

# stdin, stdout
$ echo "foo" { "bar" "baz" } | vdfplus -
# outputs:
# {
#   "foo":  {
#     "bar":    "baz"
#   }
# }

# file in, stdout
vdfplus result.json -v
```
Formatting
```bash
# create vdf, indent with tabs and use two spaces between pairs
vdfplus -v -i \t -s 2 input.json output.vdf
```

# Notes
* Unquoted keys and values are __not__ supported
* Comments will be lost when converting from and to VDF
