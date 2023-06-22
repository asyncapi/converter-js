import fs from 'fs';
import path from 'path';

import { convert } from '../src/convert';
import { assertResults } from './helpers';

describe('convert() - 1.X.X to 2.X.X versions', () => {
  it('should convert from 1.0.0 to 2.0.0-rc1', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.0.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.0.0-rc1');
    assertResults(output, result);
  });

  it('should convert from 1.1.0 to 2.0.0-rc1', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.1.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.0.0-rc1');
    assertResults(output, result);
  });

  it('should convert from 1.2.0 to 2.0.0-rc1', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.0.0-rc1');
    assertResults(output, result);
  });

  it('should convert from 1.2.0 to 2.0.0-rc1 - stream', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'gitter-streaming.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'gitter-streaming.yml'), 'utf8');
    const result = convert(input, '2.0.0-rc1');
    assertResults(output, result);
  });

  it('should convert from 1.2.0 to 2.0.0-rc1 - events', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'slack-rtm.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'slack-rtm.yml'), 'utf8');
    const result = convert(input, '2.0.0-rc1');
    assertResults(output, result);
  });

  it('should convert from 1.0.0 to 2.0.0-rc2', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.0.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.0.0-rc2');
    assertResults(output, result);
  });

  it('should convert from 1.1.0 to 2.0.0-rc2', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.1.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.0.0-rc2');
    assertResults(output, result);
  });

  it('should convert from 1.2.0 to 2.0.0-rc2 - stream', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'gitter-streaming.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'gitter-streaming.yml'), 'utf8');
    const result = convert(input, '2.0.0-rc2');
    assertResults(output, result);
  });

  it('should convert from 1.2.0 to 2.0.0-rc2 - events', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'slack-rtm.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'slack-rtm.yml'), 'utf8');
    const result = convert(input, '2.0.0-rc2');
    assertResults(output, result);
  });

  it('should convert from 1.2.0 to 2.0.0-rc2', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.0.0-rc2');
    assertResults(output, result);
  });

  it('should convert from 1.0.0 to 2.0.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.0.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.0.0');
    assertResults(output, result);
  });

  it('should convert from 1.1.0 to 2.0.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.1.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.0.0');
    assertResults(output, result);
  });

  it('should convert from 1.2.0 to 2.0.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.0.0');
    assertResults(output, result);
  });

  it('should convert from 1.0.0 to 2.1.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.0.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.1.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.1.0');
    assertResults(output, result);
  });

  it('should convert from 1.1.0 to 2.1.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.1.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.1.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.1.0');
    assertResults(output, result);
  });

  it('should convert from 1.2.0 to 2.1.0', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'streetlights.yml'), 'utf8');
    const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.1.0', 'streetlights.yml'), 'utf8');
    const result = convert(input, '2.1.0');
    assertResults(output, result);
  });
});
