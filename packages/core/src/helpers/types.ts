export type FlagValue = boolean | string | string[];
export type ArgumentValue = string | string[];

export interface FlagSchema {
  /**
   * shorten of flag key，such as `-h` indicate `--help`
   */
  shorten?: string;
  /**
   * the description of flag
   */
  description?: string;
  /**
   * whether the flag is required, all flags are optional as default
   */
  required?: boolean;
  /**
   * whether the value of flag is required
   * if true, that means expecting the value of the flag must be string
   */
  valueRequired?: boolean;
  /**
   * whether the flag is variadic
   * if true, the flag could be set multi times
   * and the parsed result will be an array
   */
  variadic?: boolean;
  /**
   * the valid choices for the value of flag
   */
  choices?: string[];
  /**
   * the default value of flag when it not set
   */
  default?: FlagValue;
  /**
   * not print in help info
   */
  hidden?: boolean;
}

export interface ArgumentSchema {
  /**
   * the name of argument
   */
  name: string;
  /**
   * the description of argument
   */
  description?: string;
  /**
   * whether the argument is optional, only the last argument can be optional
   */
  optional?: boolean;
  /**
   * whether the argument is variadic
   * if true, the argument can be input multi values
   * and the parsed result will be an array
   * only the last argument can be variadic
   */
  variadic?: boolean;
  /**
   * the valid choices for the value of argument
   */
  choices?: string[];
  /**
   * the default value of argument when it not input
   */
  default?: ArgumentValue;
}

/**
 * the schema declaration of command
 */
export interface CommandSchema {
  /**
   * the schema map of subcommands
   * the key of it is subcommand name
   * the value is the schema of it
   */
  commands?: {
    [subcommand: string]: CommandSchema;
  };
  /**
   * the description of command
   */
  description?: string;
  /**
   * the schema map of flags
   * the key of it is the flag name, such as `help`
   * the value is the flag schema
   */
  flags?: {
    [name: string]: FlagSchema;
  };
  /**
   * the schema list of arguments
   */
  arguments?: ArgumentSchema[];
  /**
   * if allow unknown options passed in
   */
  allowUnknownFlags?: boolean;
  /**
   * if allow unknown argument passed in
   */
  allowUnknownArguments?: boolean;
  /**
   * the action filepath of the command
   * it might be the exact inline implementation of the command
   */
  action?: string | Action;
  /**
   * indicate which mod the command come from,
   * this field will be set when merging schema
   * 'name' indicate the identity name of the mod
   * 'from' indicate the schema path when the mod is load from schema file
   */
  mod?: {
    name: string;
    from?: string;
  };
  /**
   * not print in help info
   */
  hidden?: boolean;
}

/**
 * serialized error object
 */
export interface NormalizedError extends Error {
  /**
   * indicate who produce the error
   */
  issuer: string;
  context: Context;
}

export interface Context<
  Args extends object = Record<string, ArgumentValue | undefined>,
  Flags extends object = Record<string, FlagValue | undefined>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  State extends object = any,
> {
  /**
   * the cwd when execute command
   */
  cwd: string;
  /**
   * the name of actual using cli
   */
  name: string;
  /**
   * the command argv user input
   */
  argv: string[];
  /**
   * installed mods, ordered by installed time
   */
  mods: Mod[];
  /**
   * the merged schema of all mods, it will be consumed by command parser
   */
  schema: CommandSchema;
  /**
   * the hint schema after command been parsed
   */
  hintSchema: CommandSchema;
  /**
   * parsed subcommands
   */
  subcommands: string[];
  /**
   * parsed arguments, the map key is argument name
   */
  arguments: Args;
  /**
   * the arguments not match schema when parsing command
   */
  unknownArguments: string[];
  /**
   * parsed flags, the map key is flag name
   */
  flags: Flags;
  /**
   * the flags not match schema when parsing command
   */
  unknownFlags: Record<string, FlagValue | undefined>;
  /**
   * the shorten flags that schema not provides declarations
   * the map key is shorten flag name
   */
  unknownShortenFlags: Record<string, FlagValue | undefined>;
  /**
   * allow invalid inputs(arguments, flags)
   * if true, validate input stage will be skipped
   * this just for some special cases
   */
  allowInvalidInputs: boolean;
  /**
   * the action of hint schema, it will be consumed by action trigger
   */
  action?: string | Action;
  /**
   *  the runtime errors in execution, it effects final exit code
   */
  errors: NormalizedError[];
  /**
   * the runtime state for middlewares to put some extra info
   */
  state: State;
}

/**
 * Mod is the way to add packed commands to the app
 */
export interface Mod {
  /**
   * the name of mod
   */
  name: string;
  /**
   * absolute entry path of the mod, not set when the mod is raw schema data
   */
  from?: string;
  /**
   * the command schema of the mod
   */
  schema: CommandSchema;
}

export type PluginHookAction = (context: Context) => Promise<void>;
export interface PluginHookActionWithPluginName {
  action: PluginHookAction;
  name: string;
}
export type PluginHook = (action: PluginHookAction) => void;
export interface PluginHooks {
  init: PluginHook;
  beforeParse: PluginHook;
  afterParse: PluginHook;
  beforeExecute: PluginHook;
  afterExecute: PluginHook;
  beforeHandleError: PluginHook;
}

/**
 * Plugin is the way to add more features to the cli which effect all commands
 */
export interface Plugin {
  /**
   * the name of plugin
   */
  name: string;
  /**
   * the implementation of the plugin to be applied by app when execute
   */
  apply: (hooks: PluginHooks) => void;
}

/**
 * the action implementation of command
 */
export type Action = (context: Context) => Promise<void>;

export interface AppExecuteOptions {
  argv?: string[];
  cwd?: string;
}
