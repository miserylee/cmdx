import { buildError } from '../helpers/buildError';
import { type Plugin } from '../helpers/types';

export const validateInput: Plugin = {
  name: 'builtin.validateInput',
  apply: (hooks) => {
    hooks.beforeExecute(async (context) => {
      if (context.allowInvalidInputs) {
        return;
      }
      const errors: string[] = [];
      if (!context.hintSchema.allowUnknownFlags) {
        // unknown flag
        Object.keys(context.unknownFlags).forEach((optionKey) => {
          errors.push(`unknown flag '${optionKey}'.`);
        });
        // unknown shorten flag
        Object.keys(context.unknownShortenFlags).forEach((optionKey) => {
          errors.push(`unknown shorten flag '${optionKey}'.`);
        });
      }
      if (!context.hintSchema.allowUnknownArguments) {
        // unknown arguments
        context.unknownArguments.forEach((argument) => {
          errors.push(`unknown argument '${argument}'.`);
        });
      }
      // validate flags
      Object.entries(context.hintSchema.flags || {}).forEach(([flagKey, flagSchema]) => {
        // validate required flag
        if (flagSchema.required && !(flagKey in context.flags)) {
          errors.push(`flag '${flagKey}' is required.`);
          return;
        }
        // validate value required flag
        if (flagSchema.valueRequired && ['boolean'].includes(typeof context.flags[flagKey])) {
          errors.push(`flag '${flagKey}' should have value.`);
          return;
        }
        // choices flag
        if (flagSchema.choices) {
          const choices = flagSchema.choices;
          const flagValue = context.flags[flagKey];
          if (flagValue !== undefined) {
            const arrValues = Array.isArray(flagValue) ? flagValue : [flagValue];
            arrValues.forEach((value) => {
              if (typeof value !== 'string' || !choices.includes(value)) {
                errors.push(`'${value}' is not allowed for flag '${flagKey}', choices: ${choices.join('|')}`);
              }
            });
          }
        }
      });
      // validate arguments
      (context.hintSchema.arguments || []).forEach((argumentSchema) => {
        // validate required argument
        if (!argumentSchema.optional && !(argumentSchema.name in context.arguments)) {
          errors.push(`argument '${argumentSchema.name}' is required.`);
          return;
        }
        // choices argument
        if (argumentSchema.choices) {
          const choices = argumentSchema.choices;
          const argumentValue = context.arguments[argumentSchema.name];
          if (argumentValue !== undefined) {
            const arrValues = Array.isArray(argumentValue) ? argumentValue : [argumentValue];
            arrValues.forEach((value) => {
              if (typeof value !== 'string' || !choices.includes(value)) {
                errors.push(
                  `'${value}' is not allowed for argument '${
                    argumentSchema.name
                  }', choices: ${choices.join('|')}`
                );
              }
            });
          }
        }
      });
      // save errors to context
      if (errors.length > 0) {
        context.errors.push(
          buildError(
            `validate input failed with errors:\n- ${errors.join('\n- ')}`,
            'internal.validateInput',
            context
          )
        );
      }
    });
  },
};
