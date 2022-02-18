const assert = require('assert');
const fs = require('fs');
const path = require("path");
const { convert } = require('../lib');
const { serialize } = require('../lib/helpers');

describe('#convert', () => {
    it('should not convert to lowest version', () => {
        assert.throws(
            () => convert(`asyncapi: '2.1.0'`, '2.0.0'),
            /^Error: Cannot downgrade from 2.1.0 to 2.0.0.$/
        );
    });

    it('should not convert from non existing version', () => {
        assert.throws(
            () => convert(`asyncapi: '2.0.0-rc3'`, '2.1.0'),
            /^Error: Cannot convert from 2.0.0-rc3 to 2.1.0.$/
        );
    });

    it('should not convert to this same version', () => {
        assert.throws(
            () => convert(`asyncapi: '2.1.0'`, '2.1.0'),
            /^Error: Cannot convert to the same version.$/
        );
    });

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

    it('should convert from 2.0.0 to 2.1.0 (JSON case)', () => {
        const input = fs.readFileSync(path.resolve(__dirname, 'input', '2.0.0', 'streetlights.json'), 'utf8');
        let output = fs.readFileSync(path.resolve(__dirname, 'output', '2.1.0', 'streetlights.json'), 'utf8');
        let result = convert(input, '2.1.0');

        output = JSON.stringify(JSON.parse(output));
        result = JSON.stringify(JSON.parse(JSON.stringify(result)));
        assert.strictEqual(output, result);
    });
});

describe('#serialize', () => {
    it('should serialize JSON', () => {
        const input = '{"foo": "bar"}';
        const output = serialize(input);
        assert.strictEqual(output.isYAML, false);
        assert.deepEqual(output.parsed, {foo: "bar"});
    });

    it('should serialize YAML', () => {
        const input = 'foo: bar';
        const output = serialize(input);
        assert.strictEqual(output.isYAML, true);
        assert.deepEqual(output.parsed, {foo: "bar"});
    });

    it('should serialize YAML (with JSON syntax)', () => {
        const input = '{foo: bar}';
        const output = serialize(input);
        assert.strictEqual(output.isYAML, true);
        assert.deepEqual(output.parsed, {foo: "bar"});
    });

    it('should throw error', () => {
        const input = '%{foo: bar}';
        try {
            serialize(input);
        } catch(e) {
            assert.strictEqual(e.message, 'AsyncAPI document must be a valid JSON or YAML document.');
        }
    });
});

/*
  It is a helper required for testing on windows. It can't be solved by editor configuration and the end line setting because expected result is converted during tests.
  We need to remove all line breaks from the string
*/
function removeLineBreaks(str) {
    return str.replace(/\r?\n|\r/g, '')
}

function assertResults(output, result){
    assert.strictEqual(removeLineBreaks(output), removeLineBreaks(result));
}
