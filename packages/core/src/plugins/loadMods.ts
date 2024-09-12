import { printDebug } from '@cmdx/printer';

import { importModule } from '../helpers/importModule';
import { type Mod, type Plugin } from '../helpers/types';

export const loadMods: Plugin = {
  name: 'builtin.loadMods',
  apply: (hooks) => {
    hooks.beforeParse(async (context) => {
      context.mods = await Promise.all(
        context.mods.map(async ({ name, from, schema }) => {
          if (from) {
            try {
              const _mod = await importModule<Mod>(from);
              name = _mod.name ?? name;
              schema = _mod.schema ?? {};
            } catch (e) {
              printDebug(
                `load mod from '${from}' failed, please check if it is a valid json file or exports as valid schema.`
              );
              schema = {};
            }
            return { name, from, schema };
          } else {
            return { name, schema };
          }
        })
      );
    });
  },
};
