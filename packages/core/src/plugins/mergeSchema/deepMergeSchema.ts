import { printDebug } from '@cmdx/printer';

import { fixSchema } from './fixSchema';
import { type CommandSchema } from '../../helpers/types';

function mergeCommands(
  current: CommandSchema,
  after: CommandSchema,
  subcommands: string[]
): Record<string, CommandSchema> {
  const commands: Record<string, CommandSchema> = {};
  if (current.commands) {
    Object.entries(current.commands).forEach(([name, schema]) => {
      if (!schema.mod) {
        schema.mod = current.mod;
      }
      commands[name] = schema;
    });
  }
  if (after.commands) {
    Object.entries(after.commands).forEach(([name, schema]) => {
      if (!schema.mod) {
        schema.mod = after.mod;
      }
      commands[name] = deepMergeSchema(commands[name] || {}, schema, [...subcommands, name]);
    });
  }
  return commands;
}

export function deepMergeSchema(
  current: CommandSchema,
  after: CommandSchema,
  subcommands: string[] = []
): CommandSchema {
  // all command schema will hint this branch, so validates and fix command schema here
  fixSchema(after, subcommands);

  const currentHasAction = !!current.action;
  const afterHasAction = !!after.action;
  /**
   * By Default, use current schema
   * if after has action, use after schema
   * both have no action, merge current and after schema
   * both have action, use after as main schema, merge only commands of current into it, print warning of conflict
   */
  let main: CommandSchema = current;

  if (afterHasAction) {
    main = after;
  } else if (!currentHasAction && !afterHasAction) {
    main = {
      ...current,
      ...after,
    };
  }

  if (currentHasAction && afterHasAction) {
    printDebug(
      [
        `the command '${subcommands.join(
          ' '
        )}' is conflict, prefer use the later, the commands are defined in:`,
        current.mod?.name,
        after.mod?.name,
      ].join('\n')
    );
  }
  return {
    ...main,
    commands: mergeCommands(current, after, subcommands),
  };
}
