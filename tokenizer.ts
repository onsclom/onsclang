interface TokenInfo {
  index: number;
  length: number;
}

interface BasicToken extends TokenInfo {
  type:
    | "indent"
    | "dedent"
    | "newline"
    | "plus"
    | "minus"
    | "times"
    | "divide"
    | "leftParen"
    | "rightParen"
    | "assignment"
    | "reassignment";
}

interface ValueToken extends TokenInfo {
  type: "number" | "string" | "identifier";
  value: string;
}

export type Token = BasicToken | ValueToken;

function scanTabType(input: string) {
  // TODO: scan for actual tab type
  return "  ";
}

function matchAtIndex(input: string, index: number, pattern: string) {
  for (let i = 0; i < pattern.length; i++)
    if (input[index + i] !== pattern[i]) return false;
  return true;
}

function parseIndentation(
  input: string,
  state: TokenizerState,
  tabType: string
) {
  let tabs = 0;
  let offset = 0;
  while (matchAtIndex(input, state.index + offset, tabType)) {
    offset += tabType.length;
    tabs++;
  }
  if (tabs == state.indentation + 1) {
    state.tokens.push({
      type: "indent",
      index: state.index,
      length: tabType.length,
    });
    state.index += tabType.length;
    state.indentation++;
    return { ok: true } as const;
  }
  if (tabs <= state.indentation) {
    [...Array(state.indentation - tabs)].forEach(() => {
      state.tokens.push({
        type: "dedent",
        index: state.index,
        length: tabType.length,
      });
      state.index -= tabType.length;
      state.indentation--;
    });
    return { ok: true } as const;
  }
  return { ok: false, error: "Invalid indentation" } as const;
}

function parseBasicToken(
  input: string,
  state: TokenizerState,
  type: BasicToken["type"],
  tokenString: string
) {
  if (matchAtIndex(input, state.index, tokenString)) {
    state.tokens.push({
      type,
      index: state.index,
      length: tokenString.length,
    });
    state.index += tokenString.length;
    return { ok: true } as const;
  }
  return { ok: false, error: `Token is not ${type}` } as const;
}

function parseNumber(input: string, state: TokenizerState) {
  let value = "";
  const ogIndex = state.index;
  let seenPeriod = false;
  while (
    (input[state.index] >= "0" && input[state.index] <= "9") ||
    (input[state.index] == "." && !seenPeriod)
  ) {
    if (input[state.index] == ".") seenPeriod = true;
    value += input[state.index];
    state.index++;
  }
  if (value.length > 0) {
    state.tokens.push({
      type: "number",
      index: ogIndex,
      length: value.length,
      value,
    });
    return { ok: true } as const;
  }
  state.index = ogIndex;
  return { ok: false, error: "Failed to parse number" } as const;
}

function parseString(input: string, state: TokenizerState) {
  let value = "";
  let ogIndex = state.index;
  if (input[state.index] !== "'") return { ok: false, error: "Not a string" };
  state.index++;
  while (input[state.index] !== "'" && state.index < input.length) {
    value += input[state.index];
    state.index++;
  }
  if (input[state.index] == "'") {
    state.index++;
    state.tokens.push({
      type: "string",
      index: ogIndex,
      length: state.index - ogIndex,
      value,
    });
    return { ok: true } as const;
  }
  state.index = ogIndex;
  return { ok: false, error: "Failed to parse string" } as const;
}

function parseIdentifier(input: string, state: TokenizerState) {
  let value = "";
  let ogIndex = state.index;
  let nextChar = input[state.index];
  while (
    (nextChar >= "a" && nextChar <= "z") ||
    (nextChar >= "A" && nextChar <= "Z")
  ) {
    value += nextChar;
    nextChar = input[++state.index];
  }

  if (value !== "") {
    state.tokens.push({
      type: "identifier",
      index: ogIndex,
      length: state.index - ogIndex,
      value,
    });
    return { ok: true } as const;
  }

  return { ok: false, error: "Failed to parse identifier" } as const;
}

function parseToken(input: string, state: TokenizerState) {
  const success = {
    ok: true,
  } as const;
  if (parseBasicToken(input, state, "newline", "\n").ok) {
    state.newLine = true;
    return success;
  }
  if (parseBasicToken(input, state, "assignment", ":=").ok) return success;
  if (parseBasicToken(input, state, "reassignment", "<-").ok) return success;
  if (parseBasicToken(input, state, "plus", "+").ok) return success;
  if (parseBasicToken(input, state, "minus", "-").ok) return success;
  if (parseBasicToken(input, state, "times", "*").ok) return success;
  if (parseBasicToken(input, state, "divide", "/").ok) return success;
  if (parseBasicToken(input, state, "leftParen", "(").ok) return success;
  if (parseBasicToken(input, state, "rightParen", ")").ok) return success;
  if (parseNumber(input, state).ok) return success;
  if (parseString(input, state).ok) return success;
  if (parseIdentifier(input, state).ok) return success;

  return {
    ok: false,
    error: `Failed to find token at ${state.index}`,
  } as const;
}

interface TokenizerState {
  tokens: Token[];
  index: number;
  newLine: boolean;
  indentation: number;
}

export function tokenize(
  input: string
): { ok: true; tokens: Token[] } | { ok: false; error: string } {
  const tabType = scanTabType(input);
  let state: TokenizerState = {
    tokens: [],
    index: 0,
    newLine: true,
    indentation: 0,
  };

  while (state.index < input.length) {
    if (state.newLine) {
      state.newLine = false;
      const indentationResult = parseIndentation(input, state, tabType);
      if (!indentationResult.ok) return indentationResult;
    } else if (input[state.index] == " ") {
      state.index++;
      continue;
    } else {
      const result = parseToken(input, state);
      if (!result.ok) return result;
    }
  }

  return {
    ok: true,
    tokens: state.tokens,
  };
}
