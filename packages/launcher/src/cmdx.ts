import { printFail } from '@cmdx/printer';

import app from './index';

app.execute().catch((e) => {
  printFail(e);
  process.exit(e);
});
