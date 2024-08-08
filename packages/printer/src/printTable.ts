import Table from 'cli-table3';

import { ANSI, paint } from './paint';
import { println } from './print';
import { padText, sliceText } from './processText';

function sum(arr: number[]): number {
  return arr.reduce((prev, curr) => prev + curr, 0);
}

function parseColWidths(colWidths: number[], flexGrow: boolean | number[], maxColWidth: number): number[] {
  const terminalWidth = (process.stdout.columns || 80) - colWidths.length - 2;
  const totalWidth = sum(colWidths);
  // 未自定义列宽时，平分终端宽度
  if (totalWidth === 0) {
    return colWidths.map((_) => {
      const result = Math.floor(terminalWidth / colWidths.length);
      return result > maxColWidth ? maxColWidth : result;
    });
  }
  // 自定义列宽总和小于终端宽度时，根据 flexGrow 确定列宽扩大策略
  if (totalWidth < terminalWidth) {
    if (flexGrow === false) {
      return colWidths;
    }
    flexGrow = Array.isArray(flexGrow) ? flexGrow : new Array(colWidths.length).fill(1);
    const percent = (terminalWidth - totalWidth) / sum(flexGrow);
    return colWidths.map((width, idx) => {
      const result = width + Math.floor(percent * (flexGrow as number[])[idx]);
      return result > maxColWidth ? maxColWidth : result;
    });
  } else if (totalWidth > terminalWidth) {
    const percent = (totalWidth - terminalWidth) / totalWidth;
    return colWidths.map((width, idx) => {
      const result = width - Math.ceil(percent * colWidths[idx]);
      return result > maxColWidth ? maxColWidth : result;
    });
  }
  return colWidths;
}

export interface PrintTableOptions {
  title: string;
  heads: string[];
  content: string[][];
  colWidths?: number[];
  flexGrow?: boolean | number[];
  maxColWidth?: number;
}

export function printTable({
  title,
  content,
  heads,
  colWidths,
  flexGrow = false,
  maxColWidth = 50,
}: PrintTableOptions): void {
  const finalColWidths = parseColWidths(
    colWidths?.slice(0, heads.length) || new Array(heads.length).fill(0),
    flexGrow,
    maxColWidth
  );
  const totalWidth = sum(finalColWidths) + heads.length + 1;
  const table = new Table({
    colWidths: finalColWidths,
  });
  content.unshift(heads);
  table.push(
    ...content.map((row, rowIndex) =>
      row.map((cell, idx) => {
        const cellMaxWidth = finalColWidths[idx] - 2;
        const str = String(cell);
        const segments: string[] = [];
        str.split('\n').forEach((line) => {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const seg = sliceText(line, 0, cellMaxWidth);
            line = line.slice(seg.length);
            if (seg) {
              segments.push(rowIndex === 0 ? paint(ANSI.bold, ANSI.magenta)(seg) : seg);
            } else {
              break;
            }
          }
        });
        return { content: segments.join('\n') };
      })
    )
  );
  println(paint(ANSI.bold)(padText(title, ` ${totalWidth} `)));
  println(table.toString());
}
