import { tokenize, parse, prettyPrint } from "./index";

function test(input: string) {
  const tokenizer = tokenize(input);
  if (tokenizer.success === false) return `Tokenizer Error: ${tokenizer.error}`;
  const parser = parse(tokenizer.tokens);
  if (parser.success === false) return `Parser Error: ${parser.error}`;
  return prettyPrint(parser.parseNodes);
}

test("2 + a 2");
test("2 + 3 + 4 + 5");
test("2 + 3 - 4 * 5 / 6");
test("2 * 4 - -3");
