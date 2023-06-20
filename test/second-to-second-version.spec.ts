import fs from 'fs';
import path from 'path';

import { convert } from '../src/convert';
import { assertResults } from './helpers';

describe('convert() - 2.X.X to 2.X.X versions', () => {
  it('should convert from 2.0.0-rc1 to 2.0.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.0.0');
    assertResults(output, result);
  });

  it('should convert from 2.0.0-rc2 to 2.0.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.0.0');
    assertResults(output, result);
  });

  it('should convert from 2.0.0-rc1 to 2.1.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.1.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.1.0');
    assertResults(output, result);
  });

  it('should convert from 2.0.0-rc2 to 2.1.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.1.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.1.0');
    assertResults(output, result);
  });

  it('should convert from 2.0.0 to 2.1.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.0.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.1.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.1.0');
    assertResults(output, result);
  });

  it('should convert from 2.0.0 to 2.2.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.0.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.2.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.2.0');
    assertResults(output, result);
  });

  it('should convert from 2.1.0 to 2.2.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.1.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.2.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.2.0');
    assertResults(output, result);
  });

  it('should convert from 2.1.0 to 2.3.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.1.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.3.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.3.0');
    assertResults(output, result);
  });

  it('should convert from 2.2.0 to 2.3.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.2.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.3.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.3.0');
    assertResults(output, result);
  });

  it('should convert from 2.2.0 to 2.4.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.2.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.4.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.4.0');
    assertResults(output, result);
  });

  it('should convert from 2.3.0 to 2.4.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.3.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.4.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.4.0');
    assertResults(output, result);
  });

  it('should convert from 2.3.0 to 2.5.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.3.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.5.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.5.0');
    assertResults(output, result);
  });

  it('should convert from 2.4.0 to 2.5.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.4.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.5.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.5.0');
    assertResults(output, result);
  });

  it('should convert from 2.4.0 to 2.6.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.4.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.6.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.6.0');
    assertResults(output, result);
  });

  it('should convert from 2.5.0 to 2.6.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.5.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.6.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.6.0');
    assertResults(output, result);
  });
});
