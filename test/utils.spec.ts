import { serializeInput, objectToSchema, dotsToSlashes, isPlainObject, createRefObject, createRefPath, isRefObject, getValueByRef, sortObjectKeys } from '../src/utils';

describe('utils', () => {
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
      expect(() => serializeInput(input)).toThrow('AsyncAPI document must be a valid JSON or YAML document.');
    });
  });

  describe('objectToSchema()', () => {
    it('should create object schema', () => {
      const input = { someProperty: { type: 'string' } };
      expect(objectToSchema(input)).toEqual({ type: 'object', properties: { ...input } });
    });
  });

  describe('dotsToSlashes()', () => {
    it('should convert dots to slashes', () => {
      expect(dotsToSlashes('some.long.path')).toEqual('some/long/path');
    });
  });

  describe('isPlainObject()', () => {
    it('is plain object', () => {
      expect(isPlainObject({})).toEqual(true);
    });

    it('is not plain object (array case)', () => {
      expect(isPlainObject([])).toEqual(false);
    });

    it('is not plain object (null case)', () => {
      expect(isPlainObject(null)).toEqual(false);
    });

    it('is not plain object (primitive case)', () => {
      expect(isPlainObject(2137)).toEqual(false);
    });
  });

  describe('createRefObject()', () => {
    it('should create ref object', () => {
      expect(createRefObject('components', 'channel', 'someChannel')).toEqual({
        $ref: '#/components/channel/someChannel',
      });
    });
  });

  describe('createRefObject()', () => {
    it('should create ref object', () => {
      expect(createRefPath('components', 'channel', 'someChannel')).toEqual('#/components/channel/someChannel');
    });
  });

  describe('isRefObject()', () => {
    it('is ref object', () => {
      expect(isRefObject({ $ref: '#/components/channel/someChannel' })).toEqual(true);
    });

    it('is not ref object', () => {
      expect(isRefObject({})).toEqual(false);
    });
  });

  describe('getValueByRef()', () => {
    const data = {
      components: {
        schemas: {
          someSchema: {
            type: 'string'
          }
        }
      }
    }

    it('should return value', () => {
      expect(getValueByRef(data, '#/components/schemas/someSchema')).toEqual(data.components.schemas.someSchema);
    });

    it('should return undefined if path does not exist', () => {
      expect(getValueByRef(data, '#/components/schemas/anotherSchema')).toEqual(undefined);
    });

    it('should return undefined if ref is invalid', () => {
      expect(getValueByRef(data, 'components/schemas/someSchema')).toEqual(undefined);
    });
  });

  describe('sortObjectKeys()', () => {
    it('should sort keys in given order', () => {
      const data = {
        first: '',
        third: '',
        next: '',
        second: '',
      };

      const sorted = sortObjectKeys(data, ['first', 'second', 'third']);
      expect(Object.keys(sorted)).toEqual(['first', 'second', 'third', 'next']);
    });
  });
});
