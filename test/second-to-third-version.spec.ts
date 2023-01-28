import fs from 'fs';
import path from 'path';

import { convert } from '../src/convert';
import { assertResults } from './helpers';

describe('convert() - 2.X.X to 3.X.X versions', () => {
  it('should convert from 2.6.0 to 3.0.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.6.0', 'for-3.0.0.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '3.0.0', 'from-2.6.0.yml'), 'utf8');
    const result = convert(input, '3.0.0');
    assertResults(output, result);
  });
});
