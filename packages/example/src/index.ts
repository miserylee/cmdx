import { App } from '@cmdx/core';

import schema from './schema';

const app = new App('cmdx-example');

app.installMod({
  name: 'example',
  schema,
});
app.installMod(require.resolve('./foo'));
app.installMod(require.resolve('./greet'));

app.execute();
