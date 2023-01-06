import { tokenize } from "./index";

function test(input: string) {
  const tokens = tokenize(input);
  console.log(tokens);
}

test("2 + a 2");
test("2 + 3 + 4 + 5");
test("2 + 3 - 4 * 5 / 6");
