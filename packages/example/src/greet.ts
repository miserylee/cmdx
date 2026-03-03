import { type Mod } from '@cmdx/core';
import { printInfo, printError } from '@cmdx/printer';

/**
 * 问候命令示例
 * 演示参数、标志、子命令的使用
 */
export default {
  name: 'greet',
  schema: {
    description: 'Greet someone with various options',
    commands: {
      hello: {
        description: 'Simple greeting',
        arguments: [
          {
            name: 'name',
            description: 'The name to greet',
          },
        ],
        flags: {
          loud: {
            shorten: 'l',
            description: 'Greet loudly (uppercase)',
          },
          repeat: {
            shorten: 'r',
            description: 'Number of times to repeat',
            valueRequired: true,
            default: '1',
          },
        },
        action: async (context) => {
          const { name } = context.arguments;
          const { loud, repeat } = context.flags;

          if (!name) {
            printError('Please provide a name');
            return;
          }

          let message = `Hello, ${name}!`;
          if (loud) {
            message = message.toUpperCase();
          }

          const times = parseInt(repeat as string, 10) || 1;
          for (let i = 0; i < times; i++) {
            printInfo(message);
          }
        },
      },
      goodbye: {
        description: 'Say goodbye',
        arguments: [
          {
            name: 'name',
            description: 'The name to say goodbye to',
          },
        ],
        flags: {
          formal: {
            shorten: 'f',
            description: 'Use formal language',
          },
        },
        action: async (context) => {
          const { name } = context.arguments;
          const { formal } = context.flags;

          const message = formal
            ? `Farewell, ${name}. Until we meet again.`
            : `Bye, ${name}!`;

          printInfo(message);
        },
      },
    },
  },
} satisfies Mod;
