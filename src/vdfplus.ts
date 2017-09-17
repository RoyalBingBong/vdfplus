const TYPEEX = {
  INT: /^\d+$/,
  FLOAT: /^\d+\.\d+$/,
  BOOLEAN: /true|false/i,
}

function parse(str: string, types = true): object {
  if (typeof str != "string") {
    throw new TypeError(
      `Expecting parameter to be string, received ${typeof str}`
    )
  }
  return _parse(str, types, 1)
}

function _parse(str: string, types = true, currentLine: number): object {
  let obj: any = {}
  let line = currentLine || 1 // we start at one boys
  let openBracket = false
  let bracketCount = 0
  let openQuote = false
  let startComment = false
  let potentialComment = false

  let globalBrackets = 0
  let globalQuotes = 0

  let expectKey = true
  let expectValue = false

  let currentKey = ""
  let currentValue: any = ""

  for (let i = 0; i < str.length; i++) {
    let char = str[i]
    if (char == '"') {
      if (!openBracket) {
        // Allow escaped qutoes inside tokens
        if (str[i - 1] && str[i - 1] == "\\") {
          if (expectKey) {
            currentKey += char
          }
          if (expectValue) {
            currentValue += char
          }
          continue
        }
        if (!openQuote) {
          openQuote = true
          globalQuotes++
        } else {
          openQuote = false
          globalQuotes--
          if (expectKey) {
            expectKey = false
            expectValue = true
            continue
          }
          if (expectValue) {
            expectKey = true
            expectValue = false

            if (types) {
              if (TYPEEX.INT.test(currentValue)) {
                currentValue = parseInt(currentValue)
              } else if (TYPEEX.FLOAT.test(currentValue)) {
                currentValue = parseFloat(currentValue)
              } else if (TYPEEX.BOOLEAN.test(currentValue)) {
                currentValue = currentValue.toLowerCase() == "true"
              }
            }

            if (currentKey in obj) {
              if (Array.isArray(obj[currentKey])) {
                obj[currentKey].push(currentValue)
              } else {
                obj[currentKey] = [obj[currentKey], currentValue]
              }
            } else {
              obj[currentKey] = currentValue
            }
            currentKey = ""
            currentValue = ""
          }
        }
        continue
      }
    }
    if (char == "{") {
      if (!openQuote) {
        bracketCount++
        globalBrackets++
        if (expectKey) {
          /**
           * value-token just closed with } or "
           * looking for key-token
           */
          throw new SyntaxError(`Unexpected token ${char} in VDF in line ${line}`)
        }
        if (expectValue && !openBracket) {
          openBracket = true
          continue
        }
        if (!expectValue) {
          continue
        }
      }
    }

    if (char == "}") {
      if (!openQuote) {
        bracketCount--
        globalBrackets--
        if (openBracket && bracketCount == 0) {
          openBracket = false
          if (expectValue) {
            let value = _parse(currentValue, types, line)
            // Duplicate keys get merged into an array
            if (currentKey in obj) {
              if (Array.isArray(obj[currentKey])) {
                obj[currentKey].push(value)
              } else {
                obj[currentKey] = [obj[currentKey], value]
              }
            } else {
              obj[currentKey] = value
            }
            currentKey = ""
            currentValue = ""
            expectKey = true
            expectValue = false
          }
        }
        if (!expectValue) {
          continue
        }
      }
    }

    if (char == "\n") {
      line++
      if (startComment) {
        startComment = false
      }
      // if(openQuote) {
      //   throw new SyntaxError(`Unexpected line break at line ${line}. Missing quotation to close token"`)
      // }
    }

    if (expectKey && openQuote) {
      currentKey += char
      continue
    }

    if (expectValue && (openQuote || openBracket)) {
      currentValue += char
      continue
    }

    if (char == "/") {
      if (!openQuote || !openBracket) {
        if (startComment) {
          continue
        }
        if (!potentialComment) {
          potentialComment = true
          continue
        }
        if (str[i - 1] && str[i - 1] == "/") {
          potentialComment = false
          startComment = true
          continue
        }
      }
    }
  }

  /**
   * Things have to "check out" before we return the object
   */
  if (globalBrackets > 0) {
    let bracket = globalBrackets > 1 ? "brackets" : "bracket"
    throw new SyntaxError(
      `VDF seems to be malformed. Found ${globalBrackets} unclosed ${bracket}.`
    )
  }
  if (globalQuotes > 0) {
    let quote = globalBrackets > 1 ? "quotes" : "quote"
    throw new SyntaxError(
      `VDF seems to be malformed. Found ${globalQuotes} unclosed ${quote}.`
    )
  }
  return obj
}

function stringify(value: any, space?: number | string, seperator?: string) {
  if (!value || typeof value != "object") {
    throw new TypeError(`Expected object got ${typeof value}`)
  }
  let stack = []
  let indent = ""
  let gap
  if (!space) {
    gap = "  "
  } else if (typeof space == "number") {
    gap = "".padStart(space)
  } else if (typeof space == "string") {
    if (!/^\s+$/.test(space)) {
      throw new TypeError(
        "space has to be a string containing only whitespace characters"
      )
    }
    gap = space.substring(0, 10)
  }
  if (!seperator) {
    seperator = "\t"
  } else {
    if (!/^\s+$/.test(seperator)) {
      throw new TypeError(
        "seperator has to be a string containing only whitespace characters"
      )
    }
  }

  let datobject = {}
  datobject[""] = value
  return serialize("", datobject, gap, indent, seperator)
}

function serialize(key, obj: object, whitespace, indentation, seperator) {
  let value: any = obj[key]
  let prefix = indentation
  indentation += whitespace
  if (typeof value != "object") {
    return quote("" + value)
  } else {
    let results = []
    for (let subkey in value) {
      if (Array.isArray(value[subkey])) {
        let arr = value[subkey]
        for (let i = 0; i < arr.length; i++) {
          let elem = serialize(i, arr, whitespace, indentation, seperator)
          if (typeof arr[i] == "object") {
            results.push(
              `${quote(
                subkey
              )}${whitespace}{\n${indentation}${elem}\n${prefix}}`
            )
          } else {
            results.push(`${quote(subkey)}${whitespace}${elem}`)
          }
        }
      } else if (typeof value[subkey] == "object") {
        let elem = serialize(subkey, value, whitespace, indentation, seperator)
        results.push(
          `${quote(subkey)}${whitespace}{\n${indentation}${elem}\n${prefix}}`
        )
      } else {
        let elem = serialize(subkey, value, whitespace, indentation, seperator)
        results.push(`${quote(subkey)}${"\t"}${elem}`)
      }
    }
    return results.join(`\n${prefix}`)
  }
}

function quote(str: string): string {
  return `"${str}"`
}

// const VDF =
export = {
  parse: parse,
  stringify: stringify,
}
