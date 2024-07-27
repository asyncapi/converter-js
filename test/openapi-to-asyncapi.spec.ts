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
  it("should convert the openapi operation and parameter keywoards to asyncapi", () => {
    const input = fs.readFileSync(path.resolve(__dirname, "input", "openapi", "operation_and_parameter.yml"), "utf8");
    const output = fs.readFileSync(path.resolve(__dirname, "output", "openapi-to-asyncapi", "operation_and_parameter.yml"), "utf8");
    const result = convertOpenAPI(input);
    assertResults(output, result);
  });
  it("should convert the openapi components and securitySchemes keywoards to asyncapi", () => {
    const input = fs.readFileSync(path.resolve(__dirname, "input", "openapi", "components_and_security.yml"), "utf8");
    const output = fs.readFileSync(path.resolve(__dirname, "output", "openapi-to-asyncapi", "components_and_security.yml"), "utf8");
    const result = convertOpenAPI(input);
    assertResults(output, result);
  });
  it("should convert the openapi contents and callbacks keywoards to asyncapi", () => {
    const input = fs.readFileSync(path.resolve(__dirname, "input", "openapi", "callbacks_and_contents.yml"), "utf8");
    const output = fs.readFileSync(path.resolve(__dirname, "output", "openapi-to-asyncapi", "callbacks_and_contents.yml"), "utf8");
    const result = convertOpenAPI(input);
    assertResults(output, result);
  });
});