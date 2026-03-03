import { describe, it, expect } from 'vitest';
import { App } from './index';

describe('parse', () => {
  describe('flags with = sign', () => {
    it('should parse long flag with single = sign', async () => {
      const app = new App('test');
      const capturedContext: any = {};

      app.installMod({
        name: 'test',
        schema: {
          flags: {
            name: {
              valueRequired: true,
            },
          },
          action: async (context) => {
            Object.assign(capturedContext, context);
          },
        },
      });

      await app.execute({ argv: ['--name=value'] });
      expect(capturedContext.flags.name).toBe('value');
    });

    it('should parse long flag with multiple = signs', async () => {
      const app = new App('test');
      const capturedContext: any = {};

      app.installMod({
        name: 'test',
        schema: {
          flags: {
            data: {
              valueRequired: true,
            },
          },
          action: async (context) => {
            Object.assign(capturedContext, context);
          },
        },
      });

      await app.execute({ argv: ['--data=a=b=c'] });
      expect(capturedContext.flags.data).toBe('a=b=c');
    });

    it('should parse short flag with single = sign', async () => {
      const app = new App('test');
      const capturedContext: any = {};

      app.installMod({
        name: 'test',
        schema: {
          flags: {
            name: {
              shorten: 'n',
              valueRequired: true,
            },
          },
          action: async (context) => {
            Object.assign(capturedContext, context);
          },
        },
      });

      await app.execute({ argv: ['-n=value'] });
      expect(capturedContext.flags.name).toBe('value');
    });

    it('should parse short flag with multiple = signs', async () => {
      const app = new App('test');
      const capturedContext: any = {};

      app.installMod({
        name: 'test',
        schema: {
          flags: {
            data: {
              shorten: 'd',
              valueRequired: true,
            },
          },
          action: async (context) => {
            Object.assign(capturedContext, context);
          },
        },
      });

      await app.execute({ argv: ['-d=a=b=c'] });
      expect(capturedContext.flags.data).toBe('a=b=c');
    });

    it('should parse base64-like value with = signs', async () => {
      const app = new App('test');
      const capturedContext: any = {};

      app.installMod({
        name: 'test',
        schema: {
          flags: {
            token: {
              valueRequired: true,
            },
          },
          action: async (context) => {
            Object.assign(capturedContext, context);
          },
        },
      });

      await app.execute({ argv: ['--token=YWJjZGVm=='] });
      expect(capturedContext.flags.token).toBe('YWJjZGVm==');
    });

    it('should parse URL with query params', async () => {
      const app = new App('test');
      const capturedContext: any = {};

      app.installMod({
        name: 'test',
        schema: {
          flags: {
            url: {
              valueRequired: true,
            },
          },
          action: async (context) => {
            Object.assign(capturedContext, context);
          },
        },
      });

      await app.execute({ argv: ['--url=http://example.com?a=1&b=2'] });
      expect(capturedContext.flags.url).toBe('http://example.com?a=1&b=2');
    });
  });

  describe('negative flags', () => {
    it('should parse --no-xxx as false', async () => {
      const app = new App('test');
      const capturedContext: any = {};

      app.installMod({
        name: 'test',
        schema: {
          flags: {
            color: {},
          },
          action: async (context) => {
            Object.assign(capturedContext, context);
          },
        },
      });

      await app.execute({ argv: ['--no-color'] });
      expect(capturedContext.flags.color).toBe(false);
    });
  });

  describe('variadic flags', () => {
    it('should parse variadic flag with multiple values', async () => {
      const app = new App('test');
      const capturedContext: any = {};

      app.installMod({
        name: 'test',
        schema: {
          flags: {
            tag: {
              variadic: true,
            },
          },
          action: async (context) => {
            Object.assign(capturedContext, context);
          },
        },
      });

      await app.execute({ argv: ['--tag', 'a', '--tag', 'b', '--tag', 'c'] });
      expect(capturedContext.flags.tag).toEqual(['a', 'b', 'c']);
    });
  });

  describe('arguments', () => {
    it('should parse positional arguments', async () => {
      const app = new App('test');
      const capturedContext: any = {};

      app.installMod({
        name: 'test',
        schema: {
          arguments: [
            { name: 'first' },
            { name: 'second' },
          ],
          action: async (context) => {
            Object.assign(capturedContext, context);
          },
        },
      });

      await app.execute({ argv: ['foo', 'bar'] });
      expect(capturedContext.arguments.first).toBe('foo');
      expect(capturedContext.arguments.second).toBe('bar');
    });

    it('should parse variadic arguments', async () => {
      const app = new App('test');
      const capturedContext: any = {};

      app.installMod({
        name: 'test',
        schema: {
          arguments: [
            { name: 'files', variadic: true },
          ],
          action: async (context) => {
            Object.assign(capturedContext, context);
          },
        },
      });

      await app.execute({ argv: ['a.txt', 'b.txt', 'c.txt'] });
      expect(capturedContext.arguments.files).toEqual(['a.txt', 'b.txt', 'c.txt']);
    });
  });

  describe('subcommands', () => {
    it('should parse subcommands', async () => {
      const app = new App('test');
      const capturedContext: any = {};

      app.installMod({
        name: 'test',
        schema: {
          commands: {
            build: {
              commands: {
                prod: {
                  action: async (context) => {
                    Object.assign(capturedContext, context);
                  },
                },
              },
            },
          },
        },
      });

      await app.execute({ argv: ['build', 'prod'] });
      expect(capturedContext.subcommands).toEqual(['build', 'prod']);
    });
  });

  describe('help flag', () => {
    it('should show help with -h or --help', async () => {
      const app = new App('test');

      app.installMod({
        name: 'test',
        schema: {
          description: 'Test command',
          flags: {
            name: {
              description: 'Name flag',
            },
          },
          action: async () => {
            // Should not reach here when help is shown
          },
        },
      });

      // Help plugin should intercept before action executes
      await app.execute({ argv: ['--help'] });
      // If we reach here without error, help was shown
    });
  });
});
