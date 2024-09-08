import fs from 'fs';
import path from 'path';
import { convertPostman } from '../src/convert';
import { assertResults } from './helpers';

describe("convert() - postman to asyncapi", () => {
  it("should convert the basic structure of postman collection to asyncapi", () => {
    const input = fs.readFileSync(path.resolve(__dirname, "input", "postman", "basic-collection.yml"), "utf8");
    const output = fs.readFileSync(path.resolve(__dirname, "output", "postman-to-asyncapi", "basic-collection.yml"), "utf8");
    const result = convertPostman(input, '3.0.0');
    assertResults(output, result);
  });

  it("should convert headers and authentication from postman collection to asyncapi", () => {
    const input = fs.readFileSync(path.resolve(__dirname, "input", "postman", "header-authentication.yml"), "utf8");
    const output = fs.readFileSync(path.resolve(__dirname, "output", "postman-to-asyncapi", "header-authentication.yml"), "utf8");
    const result = convertPostman(input, '3.0.0');
    assertResults(output, result);
  });
  it("should convert headers and authentication from postman collection to asyncapi with perspective option client", () => {
    const input = fs.readFileSync(path.resolve(__dirname, "input", "postman", "header-authentication.yml"), "utf8");
    const output = fs.readFileSync(path.resolve(__dirname, "output", "postman-to-asyncapi", "header-option-client.yml"), "utf8");
    const result = convertPostman(input, '3.0.0', { perspective: 'client' });
    assertResults(output, result);
  });
});
