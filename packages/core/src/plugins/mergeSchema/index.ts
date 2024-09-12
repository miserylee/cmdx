import { deepMergeSchema } from './deepMergeSchema';
import { type CommandSchema, type Plugin } from '../../helpers/types';

export const mergeSchema: Plugin = {
  name: 'builtin.mergeSchema',
  apply: (hooks) => {
    hooks.beforeParse(async (context) => {
      context.schema = context.mods.reduce<CommandSchema>((acc, { schema, name, from }) => {
        schema.mod = { name, from };
        return deepMergeSchema(acc, schema);
      }, {});
      context.hintSchema = context.schema;
    });
  },
};
