import { App } from '@cmdx/core';

import schema from './schema';

const app = new App();

app.installMod({
  name: 'example',
  schema,
});
app.installMod(require.resolve('./foo'));

app.execute();
