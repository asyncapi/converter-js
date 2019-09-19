const assert = require('assert');
const fs = require('fs');
const path = require("path");
const { convert } = require('../lib');

describe('#convert', () => {
    it('should convert from 1.0.0 to 2.0.0-rc1', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.0.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc1');
        assert.strictEqual(output, result);
    });
    
    it('should convert from 1.1.0 to 2.0.0-rc1', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.1.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc1');
        assert.strictEqual(output, result);
    });
    
    it('should convert from 1.2.0 to 2.0.0-rc1', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc1');
        assert.strictEqual(output, result);
    });
    
    it('should convert from 1.2.0 to 2.0.0-rc1 - stream', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'gitter-streaming.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'gitter-streaming.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc1');
        assert.strictEqual(output, result);
    });
    
    it('should convert from 1.2.0 to 2.0.0-rc1 - events', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'slack-rtm.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc1', 'slack-rtm.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc1');
        assert.strictEqual(output, result);
    });
    
    it('should convert from 1.0.0 to 2.0.0-rc2', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.0.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc2');
        assert.strictEqual(output, result);
    });
    
    it('should convert from 1.1.0 to 2.0.0-rc2', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.1.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc2');
        assert.strictEqual(output, result);
    });
    
    it('should convert from 1.2.0 to 2.0.0-rc2 - stream', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'gitter-streaming.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'gitter-streaming.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc2');
        assert.strictEqual(output, result);
    });
    
    it('should convert from 1.2.0 to 2.0.0-rc2 - events', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'slack-rtm.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'slack-rtm.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc2');
        assert.strictEqual(output, result);
    });

    it('should convert from 1.2.0 to 2.0.0-rc2', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '1.2.0', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0-rc2');
        assert.strictEqual(output, result);
    });

    it('should convert from 2.0.0-rc2 to 2.0.0', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.0.0-rc2', 'streetlights.yml'), 'utf8');
        const output = fs.readFileSync(path.resolve(__dirname, 'output', '2.0.0', 'streetlights.yml'), 'utf8');
        const result = convert(input, '2.0.0');
        assert.strictEqual(output, result);
    });
});