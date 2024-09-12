import clone from 'clone';

import { type Context, type NormalizedError } from './types';

export function buildError(error: unknown, issuer: string, context: Context): NormalizedError {
  let name: string;
  let message: string = '';
  let stack: string = '';
  if (typeof error === 'string') {
    name = 'Error';
    message = error;
  } else if (error instanceof Error) {
    name = error.name;
    message = error.message;
    stack = error.stack || '';
  } else if (!!error && typeof error === 'object') {
    if (Reflect.get(error, '$$normalized')) {
      return error as NormalizedError;
    }
    name = String(Reflect.get(error, 'name') ?? 'Error');
    message = String(Reflect.get(error, 'message'));
    stack = String(Reflect.get(error, 'stack') ?? '');
  } else {
    name = 'UnknownError';
    message = String(error);
  }

  const normalizedError = new Error(message) as NormalizedError;
  normalizedError.name = name;
  normalizedError.message = message;
  normalizedError.stack = stack;
  normalizedError.issuer = issuer;
  normalizedError.context = clone(context);
  Reflect.set(normalizedError, '$$normalized', true);

  return normalizedError;
}
