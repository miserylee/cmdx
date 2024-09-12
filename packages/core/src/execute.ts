import { buildError } from './helpers/buildError';
import { importModule } from './helpers/importModule';
import { type Action, type Context } from './helpers/types';

async function importAction(filepath: string) {
  const action = await importModule<Action>(filepath);
  if (typeof action !== 'function') {
    throw new Error(`a valid function should be exported in action file.`);
  }
  return action;
}

export async function execute(context: Context): Promise<void> {
  if (!context.action) {
    context.errors.push(buildError(`the command has no action.`, 'internal.execute', context));
    return;
  }
  try {
    const action = typeof context.action === 'function' ? context.action : await importAction(context.action);
    await action(context);
  } catch (e) {
    context.errors.push(buildError(e, 'internal.execute', context));
  }
}
