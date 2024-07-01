import fs from 'fs';
import path from 'path';

import { convertOpenAPI } from '../src/convert';
import { assertResults } from './helpers';

describe("convert() - openapi to asyncapi", () => {
  it("should convert the basic structure of openapi to asyncapi", () => {
    const input = fs.readFileSync(path.resolve(__dirname, "input", "openapi", "no-channel-operation.yml"), "utf8");
    const output = fs.readFileSync(path.resolve(__dirname, "output", "openapi-to-asyncapi", "no-channel-parameter.yml"), "utf8");
    const result = convertOpenAPI(input);
    assertResults(output, result);
  });
});