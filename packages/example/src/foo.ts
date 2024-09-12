import { type Mod } from '@cmdx/core';

export default {
  name: 'foo',
  schema: {
    commands: {
      foo: {
        action: './actionFoo',
        hidden: true,
      },
    },
  },
} satisfies Mod;
