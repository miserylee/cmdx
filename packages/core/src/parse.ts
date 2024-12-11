import { type CommandSchema, type Context } from './helpers/types';

function getShortenFlags(flags: CommandSchema['flags'] = {}) {
  return Object.entries(flags).reduce<Record<string, string>>((acc, [flag, schema]) => {
    if (schema.shorten) {
      acc[schema.shorten] = flag;
    }
    return acc;
  }, {});
}

/**
 *
 *                     meet -- or cannot find matching command in schema
 *                        +-----------------------------------------+
 *                        |                                         |
 *                        |                                         |
 *             +----------|----------+                   +----------v----------+ parse as arguments
 *     start   |                     |  meet --x or -x   |                     | as more as possible;
 *   ---------->     subcommand      -----     -----------      argument       | more arguments not match schema
 *             |                     |    \   /          |                     | will append to unknownArguments
 *             +---------------------+     \ /           +-----^----------|----+
 *              parse as subcommands        |                  |          |
 *              as more as possible         |                  |          |
 *                                          |          meet -- |          | no more arg
 *                                          |                  |          |
 *                                          |                  |          |
 *                               +----------v----------+       |          |
 *                               |                     --------+          |
 *                               |        flag         |                  v
 *                               |                     -----------------> end
 *                               +---------------------+     no more arg
 *                     finish pending flag when meet -
 *                     or append to pending flag values
 *
 */

/**
 * parse command only try the best to parse all subcommands/flags/arguments
 * it doesn't check if parsed results are valid
 * it will check if hint schema is valid, e.g. the default string value not match variadic declaration
 */
export async function parse(context: Context): Promise<void> {
  const { schema, argv } = context;

  let hintSchema: CommandSchema = {};
  let stage: 'subcommand' | 'argument' | 'flag' = 'subcommand';
  let pendingFlagKey: string | undefined;
  let pendingFlagValue: boolean | string | string[] = true;
  let pendingFlagIsUnknownShorten = false;
  let shortenFlags: Record<string, string> = {};
  let nextArgumentIndex = 0;

  const collectDefaultValues = () => {
    if (stage === 'subcommand') {
      // finish subcommand stage, so hint schema will not change, set default values of flags & arguments
      Object.entries(hintSchema.flags || {}).forEach(([flagKey, flagSchema]) => {
        if (flagSchema.default !== undefined) {
          context.flags[flagKey] = flagSchema.default;
        } else if (flagSchema.variadic) {
          context.flags[flagKey] = [];
        }
      });
      (hintSchema.arguments || []).forEach((argumentSchema) => {
        if (argumentSchema.default !== undefined) {
          context.arguments[argumentSchema.name] = argumentSchema.default;
        } else if (argumentSchema.variadic) {
          context.arguments[argumentSchema.name] = [];
        }
      });
    }
  };

  const setStage = (nextStage: 'argument' | 'flag') => {
    collectDefaultValues();
    stage = nextStage;
  };

  const setHintSchema = (commandSchema: CommandSchema) => {
    // validate schema
    hintSchema = commandSchema;
    shortenFlags = getShortenFlags(commandSchema.flags);
  };

  const finishPendingFlag = () => {
    // finish pending flag stage
    if (stage === 'flag' && pendingFlagKey) {
      function transformFlagValueToSingleton() {
        if (Array.isArray(pendingFlagValue)) {
          // @NOTE: currentFlagValue should always have item in it
          pendingFlagValue = pendingFlagValue.pop()!;
        }
      }

      if (pendingFlagIsUnknownShorten) {
        // unknown shorten flag key
        transformFlagValueToSingleton();
        context.unknownShortenFlags[pendingFlagKey] = pendingFlagValue;
      } else if (pendingFlagKey in (hintSchema.flags || {})) {
        // hint flag key
        if (hintSchema.flags![pendingFlagKey].variadic) {
          // if the flag is variadic, transform result
          if (typeof pendingFlagValue === 'boolean') {
            pendingFlagValue = [];
          } else if (typeof pendingFlagValue === 'string') {
            pendingFlagValue = [pendingFlagValue];
          }
          // variadic flag must have default value [], so just append current values
          pendingFlagValue = [
            ...(context.flags[pendingFlagKey] as string[]),
            ...(pendingFlagValue as string[]),
          ];
        } else {
          transformFlagValueToSingleton();
        }
        context.flags[pendingFlagKey] = pendingFlagValue;
      } else {
        // unknown flag key
        transformFlagValueToSingleton();
        context.unknownFlags[pendingFlagKey] = pendingFlagValue;
      }
      // reset pending flag stage
      pendingFlagKey = undefined;
      pendingFlagValue = true;
      pendingFlagIsUnknownShorten = false;
    }
  };

  setHintSchema(schema);

  argv.forEach((arg) => {
    const { commands = {}, arguments: args = [] } = hintSchema;
    if (arg[0] === '-') {
      finishPendingFlag();
      // parse next flag
      if (arg[1] === '-') {
        if (!arg[2]) {
          // redirect stage to argument
          setStage('argument');
          return;
        }
        // hint long flag key
        pendingFlagKey = arg.slice(2);
        if (pendingFlagKey.includes('=')) {
          const [left, right] = pendingFlagKey.split('=');
          pendingFlagKey = left;
          pendingFlagValue = right;
        }
        // hint negative flag
        if (pendingFlagKey.startsWith('no-')) {
          pendingFlagKey = pendingFlagKey.slice(3);
          pendingFlagValue = false;
        }
        setStage('flag');
        return;
      }
      // hint shorten flag key
      pendingFlagKey = arg.slice(1);
      if (pendingFlagKey.includes('=')) {
        const [left, right] = pendingFlagKey.split('=');
        pendingFlagKey = left;
        pendingFlagValue = right;
      }
      if (!(pendingFlagKey in shortenFlags)) {
        pendingFlagIsUnknownShorten = true;
      } else {
        pendingFlagKey = shortenFlags[pendingFlagKey];
      }
      setStage('flag');
      return;
    }

    if (stage === 'flag') {
      // hint pending flag, append value
      if (Array.isArray(pendingFlagValue)) {
        pendingFlagValue.push(arg);
      } else if (pendingFlagValue === true) {
        pendingFlagValue = [arg];
      } else if (pendingFlagValue === false) {
        // negative flag, ignore pending values
        pendingFlagValue = false;
      } else {
        pendingFlagValue = [pendingFlagValue, arg];
      }
      return;
    }

    if (stage === 'subcommand') {
      if (arg in commands) {
        // hint subcommand
        setHintSchema(commands[arg]);
        context.subcommands.push(arg);
        return;
      } else {
        setStage('argument');
      }
    }

    // stage === 'argument'
    const argument = args[nextArgumentIndex];
    if (!argument) {
      context.unknownArguments.push(arg);
      return;
    }
    if (argument.variadic) {
      const currentArgument = context.arguments[argument.name];
      if (Array.isArray(currentArgument)) {
        currentArgument.push(arg);
      } else {
        context.arguments[argument.name] = [arg];
      }
    } else {
      context.arguments[argument.name] = arg;
      nextArgumentIndex += 1;
    }
  });

  collectDefaultValues();
  finishPendingFlag();
  context.action = hintSchema.action;
  context.hintSchema = hintSchema;
}
