const assert = require('assert');
const fs = require('fs');
const path = require("path");
const { convert } = require('../lib');

describe('#convert', () => {
    it('should convert from 1.0.0 to 2.0.0-rc1', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.0.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc1');
        console.log('output', output)
        console.log('switchToUnixLinebreaks(output)', switchToUnixLinebreaks(output))
        console.log('result', result)
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });
    
    it('should convert from 1.1.0 to 2.0.0-rc1', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.1.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc1');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });
    
    it('should convert from 1.2.0 to 2.0.0-rc1', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc1');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });
    
    it('should convert from 1.2.0 to 2.0.0-rc1 - stream', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'gitter-streaming.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'gitter-streaming.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc1');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });
    
    it('should convert from 1.2.0 to 2.0.0-rc1 - events', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'slack-rtm.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'slack-rtm.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc1');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });
    
    it('should convert from 1.0.0 to 2.0.0-rc2', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.0.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc2');
        assert.strictEqual(output, switchToUnixLinebreaks(result));
    });
    
    it('should convert from 1.1.0 to 2.0.0-rc2', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.1.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc2');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });
    
    it('should convert from 1.2.0 to 2.0.0-rc2 - stream', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'gitter-streaming.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'gitter-streaming.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc2');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });
    
    it('should convert from 1.2.0 to 2.0.0-rc2 - events', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'slack-rtm.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'slack-rtm.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc2');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });

    it('should convert from 1.2.0 to 2.0.0-rc2', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc2');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });

    it('should convert from 1.0.0 to 2.0.0', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.0.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });

    it('should convert from 1.1.0 to 2.0.0', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.1.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });

    it('should convert from 1.2.0 to 2.0.0', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });

    it('should convert from 2.0.0-rc1 to 2.0.0', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });

    it('should convert from 2.0.0-rc2 to 2.0.0', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0');
        assert.strictEqual(switchToUnixLinebreaks(output), result);
    });
});

/*
  It is a helper required for testing on windows. It can't be solved by editor configuration and the end line setting because expected output is read on windows during the test.
  We need to remove `\r` from files converted on windows.
*/
function switchToUnixLinebreaks(str) {
    return str.replace(/\\r/g, "")
  }