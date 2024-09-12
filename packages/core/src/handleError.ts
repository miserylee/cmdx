import { printFail } from '@cmdx/printer';

import { type Context } from './helpers/types';

export async function handleError(context: Context): Promise<void> {
  // exit with code=1 when there has error
  if (context.errors.length > 0) {
    context.errors.forEach((error) => {
      printFail(error.message);
    });
    process.on('beforeExit', (code) => {
      if (code === 0) {
        process.exit(1);
      }
    });
  }
}
