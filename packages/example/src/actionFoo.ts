import { type Context } from '@cmdx/core';
import { printInfo } from '@cmdx/printer';

export default async function (context: Context): Promise<void> {
  printInfo('foobar');
}
