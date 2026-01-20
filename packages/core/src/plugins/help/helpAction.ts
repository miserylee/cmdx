import { ANSI, padText, paint } from '@cmdx/printer';
import wrapAnsi from 'wrap-ansi';

import { type ArgumentValue, type Context, type FlagValue } from '../../helpers/types';

function showDebugInfo() {
  return process.env.NODE_ENV !== 'production' || process.env.VERBOSE;
}

function breakLine(line: string, capacity: number): string[] {
  const brokenLines: string[] = [];
  line.split('\n').forEach((row) => {
    brokenLines.push(
      ...wrapAnsi(row, capacity, {
        trim: false,
        hard: true,
      }).split('\n')
    );
  });
  return brokenLines;
}

function formatRight(schema: {
  description?: string;
  choices?: string[];
  default?: ArgumentValue | FlagValue;
}) {
  const rightSegments: string[] = [];
  const choicesAndDefault: string[] = [];
  if (schema.default !== undefined) {
    if (Array.isArray(schema.default)) {
      choicesAndDefault.push(`Default: ${JSON.stringify(schema.default)}`);
    } else {
      choicesAndDefault.push(`Default: ${schema.default}`);
    }
  }
  if (schema.choices && schema.choices.length > 0) {
    choicesAndDefault.push(`Choices: ${schema.choices.join(', ')}`);
  }
  if (choicesAndDefault.length > 0) {
    rightSegments.push(`(${choicesAndDefault.join(' | ')})`);
  }
  rightSegments.push(schema.description || '');
  return rightSegments.join(' ');
}

function weakText(text: string) {
  return paint(ANSI.brightBlack)(text);
}

function title(text: string) {
  return paint(ANSI.bold)(text);
}

export default async (context: Context): Promise<void> => {
  const rowCapacity = 100;
  const leftCapacity = 28;
  const rightCapacity = rowCapacity - 2 - leftCapacity;

  const emptyLeft = padText('', leftCapacity);

  const { arguments: args = [], flags = {}, commands = {}, description, mod } = context.hintSchema;
  const hasArguments = args.length > 0;
  const flagEntries = Object.entries(flags);
  const commandEntries = Object.entries(commands);
  const hasCommands = Object.keys(commands).length > 0;

  const rows = [];

  if (description) {
    rows.push(...breakLine(description, rowCapacity), '');
  }

  // usage
  const usageSegments = [title(`Usage:`), context.name].concat(context.subcommands);
  if (hasArguments) {
    usageSegments.push(
      ...args.map((argumentSchema) => {
        let formattedName = argumentSchema.name;
        if (argumentSchema.variadic) {
          formattedName = `${formattedName}...`;
        }
        if (argumentSchema.optional) {
          formattedName = `[${formattedName}]`;
        } else {
          formattedName = `<${formattedName}>`;
        }
        return formattedName;
      })
    );
  }
  // flags always exists, default add --help
  usageSegments.push(`[flags]`);
  rows.push(usageSegments.join(' '), '');

  function appendFormattedRow(formattedLeft: string, formattedRight: string) {
    const brokenRightRows = breakLine(formattedRight, rightCapacity);
    const firstLineShouldCombine = formattedLeft.length <= leftCapacity;
    const paddedFormatLeft = padText(formattedLeft, `${leftCapacity} `);
    if (!firstLineShouldCombine) {
      rows.push(paddedFormatLeft);
    }
    brokenRightRows.forEach((row, index) => {
      if (index === 0 && firstLineShouldCombine) {
        rows.push(`${paddedFormatLeft}  ${row}`);
      } else {
        rows.push(`${emptyLeft}  ${row}`);
      }
    });
  }

  // arguments
  if (hasArguments) {
    rows.push(title(`Arguments:`));
    args.forEach((argumentSchema) => {
      appendFormattedRow(`  ${argumentSchema.name}`, formatRight(argumentSchema));
    });
    rows.push('');
  }

  // options
  rows.push(title(`Options:`));
  flagEntries.forEach(([optionKey, optionSchema]) => {
    if (optionSchema?.hidden && !showDebugInfo()) {
      return;
    }
    let formattedLeft = `--${optionKey}`;
    if (optionSchema.shorten) {
      formattedLeft = `-${optionSchema.shorten}, ${formattedLeft}`;
    }
    if (optionSchema.variadic) {
      formattedLeft += ` [value...]`;
    } else if (optionSchema.valueRequired || optionSchema.choices) {
      formattedLeft += ` <value>`;
    }
    formattedLeft = `  ${formattedLeft}`;

    const rightContent = formatRight(optionSchema);
    const finalRight =
      optionSchema?.hidden && showDebugInfo() ? `${rightContent} ${weakText('(hidden)')}` : rightContent;
    appendFormattedRow(formattedLeft, finalRight);
  });
  appendFormattedRow(`  -h, --help`, `display help info`);
  rows.push(``);

  // commands
  if (hasCommands) {
    rows.push(title(`Subcommands:`));
    commandEntries.forEach(([command, commandSchema]) => {
      if (commandSchema.hidden && !showDebugInfo()) {
        return;
      }
      const rightSegments = [];
      if (commandSchema.description) {
        rightSegments.push(commandSchema.description);
      }
      if (showDebugInfo()) {
        rightSegments.push(weakText(`(from mod: ${commandSchema.mod?.name})`));
      }
      if (commandSchema.hidden && showDebugInfo()) {
        rightSegments.push(weakText('(hidden)'));
      }
      appendFormattedRow(`  ${command}`, rightSegments.join(' '));
    });
    rows.push('');
  }

  // from
  if (showDebugInfo()) {
    rows.push(weakText(`The command is from mod: ${mod?.name}`));
  }

  process.stdout.write(rows.join('\n'));
  process.stdout.write('\n');
};
