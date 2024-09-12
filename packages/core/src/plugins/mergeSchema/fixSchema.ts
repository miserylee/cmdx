import path from 'path';

import { printDebug } from '@cmdx/printer';

import { type ArgumentSchema, type CommandSchema } from '../../helpers/types';

export function fixSchema(schema: CommandSchema, subcommands: string[]): void {
  const prefix =
    subcommands.length > 0 ? `[${schema.mod?.name} ${subcommands.join(' ')}]` : `[${schema.mod?.name}]`;

  // resolve action path
  if (schema.action && typeof schema.action === 'string' && schema.mod?.from) {
    schema.action = path.resolve(path.dirname(schema.mod.from), schema.action);
  }

  // fix flags schema
  const flags = schema.flags;
  if (flags) {
    /**
     * { 'no-foo': {} } drop 'no-'
     * { 'foo bar': {} } drop blank
     * { foo: { variadic: true, default: 'foobar' } } set variadic to false
     * { foo: { variadic: true, default: true } } set variadic to false
     * { foo: { default: ['foo', 'bar'] } } set variadic to true
     * { foo: { choices: [] } } drop choices
     * { foo: { choices: ['foo', 'bar'], variadic: true, default: ['aaa'] } } drop default
     * { foo: { choices: ['foo', 'bar'], default: true } } drop default
     * { foo: { choices: ['foo', 'bar'], default: 'aaa' } } drop default
     * { foo: { shorten: 'f' }, force: { shorten: 'f' } } use later
     */

    const flagEntries = Object.entries(flags);
    const existsShortens: Record<string, string[]> = {};
    flagEntries.forEach(([flagKey, flagSchema]) => {
      if (flagKey.startsWith('no-')) {
        printDebug(
          `${prefix} dropped invalid flag '${flagKey}' in schema: starts with 'no-' is not allowed, which may be conflict with negative prefix.`
        );
        Reflect.deleteProperty(flags, flagKey);
        return;
      }
      if (flagKey.includes(' ')) {
        printDebug(`${prefix} dropped invalid flag '${flagKey}' in schema: includes blank is not allowed.`);
        Reflect.deleteProperty(flags, flagKey);
        return;
      }
      if (flagSchema.variadic && (typeof flagSchema.default === 'string' || flagSchema.default === true)) {
        printDebug(
          `${prefix} auto fix invalid flag '${flagKey}' in schema (set variadic to false): the default value of variadic flag should be string array or 'false'.`
        );
        flagSchema.variadic = false;
      } else if (!flagSchema.variadic && Array.isArray(flagSchema.default)) {
        printDebug(
          `${prefix} auto fix invalid flag '${flagKey}' in schema (set variadic to true): the default value of non-variadic flag should not be array.`
        );
        flagSchema.variadic = true;
      }
      if (flagSchema.choices) {
        if (flagSchema.choices.length === 0) {
          printDebug(
            `${prefix} auto fix invalid flag '${flagKey}' in schema (drop choices): the empty choices is meaningless.`
          );
          Reflect.deleteProperty(flagSchema, 'choices');
        } else if (flagSchema.default !== undefined) {
          const choices = flagSchema.choices;
          let defaultValueIsInvalid = false;
          if (Array.isArray(flagSchema.default)) {
            flagSchema.default.forEach((value) => {
              if (!choices.includes(value)) {
                defaultValueIsInvalid = true;
              }
            });
          } else if (typeof flagSchema.default === 'boolean' || !choices.includes(flagSchema.default)) {
            defaultValueIsInvalid = true;
          }
          if (defaultValueIsInvalid) {
            printDebug(
              `${prefix} auto fix invalid flag '${flagKey}' in schema (drop default): the default value ${JSON.stringify(
                flagSchema.default
              )} is not match choices '${flagSchema.choices.join('|')}'.`
            );
            Reflect.deleteProperty(flagSchema, 'default');
          }
        }
      }
      // cache shortens for duplicated detect
      if (flagSchema.shorten) {
        existsShortens[flagSchema.shorten] = existsShortens[flagSchema.shorten] || [];
        existsShortens[flagSchema.shorten].push(flagKey);
      }
    });
    // detect duplicated shorten flags
    Object.entries(existsShortens).forEach(([shorten, flagKeys]) => {
      if (flagKeys.length > 1) {
        printDebug(
          `${prefix} shorten flag '${shorten}' is duplicated in flags '${flagKeys.join(
            '|'
          )}', prefer use the later.`
        );
      }
    });
    schema.flags = flags;
  }

  // fix arguments schema
  const args = schema.arguments;
  if (args) {
    /**
     * [{ name: true }] drop non-string name
     * [{ name: '' }] drop name is empty
     * [{ name: 'foo bar' }] drop name has blank
     * [{ name: 'a' }, { name: 'a' }] drop later duplicated
     * [{ name: 'foo', optional: true }, { name: 'bar' }] set (name=bar) optional to true
     * [{ name: 'foo', variadic: true }, { name: 'bar' }] set (name=foo) variadic to false
     * [{ name: 'foo', variadic: true, default: 'foobar' }] set variadic to false
     * [{ name: 'foo', default: ['a'] }] set variadic to true
     * [{ name: 'foo', default: ['a'] }, { name: 'bar' }] (name=foo) drop default
     * [{ name: 'foo', choices: [] }] drop choices
     * [{ name: 'foo', choices: ['a'], variadic: true, default: ['b'] }] drop default
     * [{ name: 'foo', choices: ['a'], default: 'b' }] drop default
     *
     */

    let metOptionalArgument = false;
    const existsArgumentNames: string[] = [];
    schema.arguments = args
      .map((argumentSchema, index) => {
        if (typeof argumentSchema.name !== 'string') {
          printDebug(
            `${prefix} dropped invalid argument '${argumentSchema.name}' in schema: the name is not a valid string.`
          );
          return null;
        }
        if (argumentSchema.name === '') {
          printDebug(
            `${prefix} dropped invalid argument '${argumentSchema.name}' in schema: the name should not be empty string.`
          );
          return null;
        }
        if (argumentSchema.name.includes(' ')) {
          printDebug(
            `${prefix} dropped invalid argument '${argumentSchema.name}' in schema: the name includes blank is not allowed.`
          );
          return null;
        }
        if (existsArgumentNames.includes(argumentSchema.name)) {
          printDebug(
            `${prefix} dropped invalid argument '${argumentSchema.name}' in schema: duplicated name.`
          );
          return null;
        }
        existsArgumentNames.push(argumentSchema.name);
        if (argumentSchema.optional) {
          metOptionalArgument = true;
        } else if (metOptionalArgument && !argumentSchema.optional) {
          printDebug(
            `${prefix} auto fix invalid argument '${argumentSchema.name}' in schema (set optional to true): required argument cannot define after optional argument.`
          );
          argumentSchema.optional = true;
        }
        const isLast = index === args.length - 1;
        if (!isLast && argumentSchema.variadic) {
          printDebug(
            `${prefix} auto fix invalid argument '${argumentSchema.name}' in schema (set variadic to false): only the last argument can be variadic.`
          );
          argumentSchema.variadic = false;
        }
        if (argumentSchema.variadic && typeof argumentSchema.default === 'string') {
          printDebug(
            `${prefix} auto fix invalid argument '${argumentSchema.name}' in schema (set variadic to false): the default value of variadic argument should be string array.`
          );
          argumentSchema.variadic = false;
        }
        if (!argumentSchema.variadic && Array.isArray(argumentSchema.default)) {
          if (isLast) {
            printDebug(
              `${prefix} auto fix invalid argument '${argumentSchema.name}' in schema (set variadic to true): the default value of non-variadic flag should not be array.`
            );
            argumentSchema.variadic = true;
          } else {
            printDebug(
              `${prefix} auto fix invalid argument '${argumentSchema.name}' in schema (drop default value): the default value of non-variadic flag should not be array, but the argument is not the last which cannot set to variadic, so drop the default value.`
            );
            Reflect.deleteProperty(argumentSchema, 'default');
          }
        }
        if (argumentSchema.choices) {
          if (argumentSchema.choices.length === 0) {
            printDebug(
              `${prefix} auto fix invalid argument '${argumentSchema.name}' in schema (drop choices): the empty choices is meaningless.`
            );
            Reflect.deleteProperty(argumentSchema, 'choices');
          } else if (argumentSchema.default !== undefined) {
            const choices = argumentSchema.choices;
            let defaultValueIsInvalid = false;
            if (Array.isArray(argumentSchema.default)) {
              argumentSchema.default.forEach((value) => {
                if (!choices.includes(value)) {
                  defaultValueIsInvalid = true;
                }
              });
            } else if (!choices.includes(argumentSchema.default)) {
              defaultValueIsInvalid = true;
            }
            if (defaultValueIsInvalid) {
              printDebug(
                `${prefix} auto fix invalid argument '${
                  argumentSchema.name
                }' in schema (drop default): the default value ${JSON.stringify(
                  argumentSchema.default
                )} is not match choices '${argumentSchema.choices.join('|')}'.`
              );
              Reflect.deleteProperty(argumentSchema, 'default');
            }
          }
        }
        return argumentSchema;
      })
      .filter((s): s is ArgumentSchema => Boolean(s));
  }
}
