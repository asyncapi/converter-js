import fs from 'fs';
import path from 'path';

import { convert } from '../src/convert';
import { assertResults } from './helpers';

describe('convert() - 3.X.X to 3.X.X versions', () => {
  it('should convert from 3.0.0 to 3.1.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '3.0.0', 'for-3.1.0.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '3.1.0', 'from-3.0.0.yml'), 'utf8');
    const result = convert(input, '3.1.0');
    assertResults(output, result);
  });
});
