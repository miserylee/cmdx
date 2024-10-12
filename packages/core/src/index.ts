import path from 'path';

import { printDebug } from '@cmdx/printer';

import { execute } from './execute';
import { handleError } from './handleError';
import { buildError } from './helpers/buildError';
import {
  type AppExecuteOptions,
  type Context,
  type Mod,
  type Plugin,
  type PluginHookActionWithPluginName,
} from './helpers/types';
import { parse } from './parse';
import { help } from './plugins/help';
import { loadMods } from './plugins/loadMods';
import { mergeSchema } from './plugins/mergeSchema';
import { validateInput } from './plugins/validateInput';

export class App {
  private mods: Mod[] = [];
  private plugins: Plugin[] = [];

  constructor(public readonly name: string = path.parse(process.argv[1]).name) {
    if (process.env.NODE_ENV === 'development') {
      printDebug(
        "App runs in development mode, some debug info will be print in the console for problem perception, you can set process.env.NODE_ENV to 'production' to disable it."
      );
    }
    // install builtin plugins
    this.installPlugin(loadMods);
    this.installPlugin(mergeSchema);
    this.installPlugin(help);
    this.installPlugin(validateInput);
  }

  installMod(mod: string | Mod): this {
    if (typeof mod === 'string') {
      // normalize path mod, it will be loaded by mod loader.
      this.mods.push({
        name: path.parse(mod).name,
        from: require.resolve(mod),
        schema: {},
      });
    } else {
      this.mods.push(mod);
    }
    return this;
  }

  installPlugin(plugin: Plugin): this {
    this.plugins.push(plugin);
    return this;
  }

  async execute(options: AppExecuteOptions = {}): Promise<void> {
    const cwd = options.cwd ?? process.cwd();
    const argv = options.argv ?? process.argv.slice(2);

    // init context
    const context: Context = {
      cwd,
      name: this.name,
      argv,
      mods: this.mods,
      schema: {},
      hintSchema: {},
      subcommands: [],
      arguments: {},
      unknownArguments: [],
      flags: {},
      unknownFlags: {},
      unknownShortenFlags: {},
      allowInvalidInputs: false,
      state: {},
      errors: [],
    };

    const initActions: PluginHookActionWithPluginName[] = [];
    const beforeParseActions: PluginHookActionWithPluginName[] = [];
    const afterParseActions: PluginHookActionWithPluginName[] = [];
    const beforeExecuteActions: PluginHookActionWithPluginName[] = [];
    const afterExecuteActions: PluginHookActionWithPluginName[] = [];
    const beforeHandleErrorActions: PluginHookActionWithPluginName[] = [];

    // apply all plugins
    for (const plugin of this.plugins) {
      plugin.apply({
        init: (action) => {
          initActions.push({ action, name: plugin.name });
        },
        beforeParse: (action) => {
          beforeParseActions.push({ action, name: plugin.name });
        },
        afterParse: (action) => {
          afterParseActions.push({ action, name: plugin.name });
        },
        beforeExecute: (action) => {
          beforeExecuteActions.push({ action, name: plugin.name });
        },
        afterExecute: (action) => {
          afterExecuteActions.push({ action, name: plugin.name });
        },
        beforeHandleError: (action) => {
          beforeHandleErrorActions.push({ action, name: plugin.name });
        },
      });
    }

    const runHookActions = async (actions: PluginHookActionWithPluginName[]) => {
      for await (const { action, name } of actions) {
        try {
          await action(context);
        } catch (e) {
          context.errors.push(buildError(e, name, context));
        }
      }
    };

    const runSteps = async (fns: (() => Promise<void>)[]) => {
      for await (const fn of fns) {
        if (context.errors.length > 0) {
          return;
        }
        await fn();
      }
    };

    await runSteps([
      async () => {
        // run before parse actions
        await runHookActions(initActions);
      },
      async () => {
        // run before parse actions
        await runHookActions(beforeParseActions);
      },
      async () => {
        // parse command
        try {
          await parse(context);
        } catch (e) {
          context.errors.push(buildError(e, 'internal:parse', context));
        }
      },
      async () => {
        // run after parse actions
        await runHookActions(afterParseActions);
      },
      async () => {
        // run before execute actions
        await runHookActions(beforeExecuteActions);
      },
      async () => {
        // execute command
        try {
          await execute(context);
        } catch (e) {
          context.errors.push(buildError(e, 'internal:execute', context));
        }
      },
      async () => {
        // run after execute actions
        await runHookActions(afterExecuteActions);
      },
    ]);

    // run before handle error actions
    await runHookActions(beforeHandleErrorActions);

    // final handle error
    await handleError(context);
  }
}

export * from './helpers/types';
