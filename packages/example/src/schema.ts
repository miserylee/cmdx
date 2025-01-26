import { type CommandSchema } from '@cmdx/core/lib';
import { createReactiveLog, printInfo } from '@cmdx/printer';

export default {
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
    bingo: {
      hidden: true,
      action: async () => {
        printInfo(`Congratulations!`);
      },
    },
  },
} satisfies CommandSchema;
