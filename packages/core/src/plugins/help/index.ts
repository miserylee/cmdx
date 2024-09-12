import path from 'path';

import { type Plugin } from '../../helpers/types';

export const help: Plugin = {
  name: 'help',
  apply: (hooks) => {
    hooks.afterParse(async (context) => {
      if (context.unknownShortenFlags.h || context.unknownFlags.help) {
        context.allowInvalidInputs = true;
        context.action = path.resolve(__dirname, 'helpAction');
      }
    });
  },
};
