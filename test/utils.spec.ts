import { serializeInput } from '../src/utils';

describe('serializeInput()', () => {
  it('should serialize JSON', () => {
    const input = '{"foo": "bar"}';
    const output = serializeInput(input);

    expect(output.format).toEqual('json');
    expect(output.document).toEqual({foo: "bar"});
  });

  it('should serialize YAML', () => {
    const input = 'foo: bar';
    const output = serializeInput(input);

    expect(output.format).toEqual('yaml');
    expect(output.document).toEqual({foo: "bar"});
  });

  it('should serialize YAML (with JSON syntax)', () => {
    const input = '{foo: bar}';
    const output = serializeInput(input);

    expect(output.format).toEqual('yaml');
    expect(output.document).toEqual({foo: "bar"});
  });

  it('should throw error', () => {
    const input = '%{foo: bar}';
    expect(() => serializeInput(input)).toThrow('AsyncAPI document must be a valid JSON or YAML document.')
  });
});