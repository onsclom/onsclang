interface Token {
  type: string;
  index: number;
  value: string;
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function scanTabType(input: string): string {
  return "  ";
}

function matchAtIndex(input: string, index: number, match: string): boolean {
  for (let i = 0; i < match.length; i++)
    if (input[index + i] !== match[i]) return false;
  return true;
}

function createToken(type: string, index: number, value = ""): Token {
  if (value === "") value = type;
  return { type, value, index };
}

const basicTokens = [
  "+",
  "-",
  "*",
  "/",
  "%",
  "(",
  ")",
  "{",
  "}",
  "[",
  "]",
  "\n",
];

function parseToken(input: string, index: number) {
  for (const token of basicTokens) {
    if (matchAtIndex(input, index, token)) {
      return {
        ok: true,
        value: createToken(token, index),
        index: index + token.length,
      } as const;
    }
  }
  return { ok: false, error: `Invalid token at index ${index}` } as const;
}

function parseTabs(
  input: string,
  index: number,
  tabType: string,
  tabAmount: number
) {
  let tabs = 0;
  while (matchAtIndex(input, index, tabType)) {
    tabs++;
    index += tabType.length;
  }
  if (tabs == tabAmount + 1)
    return {
      ok: true,
      value: [createToken("indent", index)],
      index,
      tabAmount: tabs,
    } as const;
  if (tabs <= tabAmount)
    return {
      ok: true,
      value: [...Array(tabAmount - tabs).fill(createToken("dedent", index))],
      index,
      tabAmount: tabs,
    } as const;
  return {
    ok: false,
    error: `Excess indentation at index ${index}`,
  } as const;
}

function tokenize(input: string): Result<Token[]> {
  const tabType = scanTabType(input);
  const tokens: Token[] = [];

  let tabAmount = 0;
  let newLine = false;
  let index = 0;

  while (index < input.length) {
    if (newLine) {
      newLine = false;
      const result = parseTabs(input, index, tabType, tabAmount);
      if (!result.ok) return result;
      tabAmount = result.tabAmount;
      tokens.push(...result.value);
      index = result.index;
    }

    const result = parseToken(input, index);
    if (!result.ok) return result;
    tokens.push(result.value);
    index = result.index;
    if (result.value.type === "\n") newLine = true;
  }

  [...Array(tabAmount)].forEach(() =>
    tokens.push(createToken("dedent", index))
  );

  return { ok: true, value: tokens };
}

tokenize(`+-
  -
    -
      -
  -`);
