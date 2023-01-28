import fs from 'fs';
import path from 'path';

import { convert } from '../src/convert';

describe('convert()', () => {
  it('should not convert to lowest version', () => {
    expect(() => convert(`asyncapi: '2.1.0'`, '2.0.0')).toThrow('Cannot downgrade from 2.1.0 to 2.0.0.');
  });

  it('should not convert from non existing version', () => {
    expect(() => convert(`asyncapi: '2.0.0-rc3'`, '2.0.0')).toThrow('Cannot convert from 2.0.0-rc3 to 2.0.0.');
  });

  it('should not convert to this same version', () => {
    expect(() => convert(`asyncapi: '2.0.0'`, '2.0.0')).toThrow('Cannot convert to the same version.');
  });

  it('should convert from 2.0.0 to 2.1.0 (JSON case)', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.0.0', 'streetlights.json'), 'utf8');
    let output = fs.readFileSync(path.resolve(__dirname, 'output', '2.1.0', 'streetlights.json'), 'utf8');
    let result = convert(input, '2.1.0');

    output = JSON.stringify(JSON.parse(output));
    result = JSON.stringify(JSON.parse(JSON.stringify(result)));
    expect(output).toEqual(result);
  });
});
