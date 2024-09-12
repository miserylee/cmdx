import * as process from 'node:process';

import { App } from '@cmdx/core';
import { createReactiveLog } from '@cmdx/printer';

const app = new App();

app.installMod({
  name: 'example',
  schema: {
    commands: {
      ping: {
        action: async () => {
          const log = createReactiveLog({
            initialState: {
              progress: 0,
            },
            render(state) {
              const [width] = process.stdout.getWindowSize() ?? [20, 0];
              const totalSize = width - 4;
              const size = Math.floor((state.progress / 100) * totalSize);
              return `[${new Array(size).fill('█').join('')}${new Array(totalSize - size).fill(' ').join('')}]`;
            },
          });
          log.print();

          const t = setInterval(() => {
            log.update((prev) => {
              const next = prev.progress + 1;
              if (next === 100) {
                process.nextTick(() => {
                  clearInterval(t);
                });
              }
              return {
                progress: next,
              };
            });
          }, 100);
        },
      },
    },
  },
});
app.installMod(require.resolve('./foo'));

app.execute();
