interface Token {
  type: "+" | "-" | "*" | "/" | "(" | ")" | "number" | "^";
  line: number;
  row: number;
  value: string;
}

interface Tokenizer {
  tokens: Token[];
  line: number;
  row: number;
  success: boolean;
  error?: string;
}

function addToken(tokenizer: Tokenizer, type: Token["type"], value = "") {
  tokenizer.tokens.push({
    type,
    line: tokenizer.line,
    row: tokenizer.row,
    value: value,
  });
}

export function tokenize(input: string): Tokenizer {
  let tokenizer: Tokenizer = {
    tokens: [],
    line: 0,
    row: 0,
    success: true,
  };

  const lines = input.split("\n");
  for (const line of lines) {
    while (tokenizer.row < line.length) {
      const nextChar = line[tokenizer.row];
      if (nextChar == " " || nextChar == "\t") {
        tokenizer.row++;
        continue;
      }
      if (["+", "-", "*", "/", "(", ")", "^"].includes(nextChar)) {
        addToken(tokenizer, nextChar as Token["type"]);
        tokenizer.row++;
        continue;
      }
      const numberRegex = /\d*\.?\d*/;
      const remainingLine = line.slice(tokenizer.row);
      if ("1234567890.".includes(nextChar)) {
        const number = remainingLine.match(numberRegex)![0];
        addToken(tokenizer, "number", number);
        tokenizer.row += number.length;
        continue;
      }

      tokenizer.success = false;
      tokenizer.error = `Unexpected character '${nextChar}' at line ${tokenizer.line} and row ${tokenizer.row}`;
      return tokenizer;
    }
    tokenizer.row = 0;
    tokenizer.line++;
  }

  return tokenizer;
}
