import { type WriteStream } from 'tty';

import { ANSI, paint } from './paint';
import { purify } from './processText';

export function print(text: string, stream: WriteStream = process.stdout): void {
  stream.write(stream.isTTY ? text : purify(text));
}

export function println(text: string, stream?: WriteStream): void {
  print(`${text}\n`, stream);
}

export function printInfo(text: string): void {
  String(text)
    .split('\n')
    .forEach((line, index) => {
      if (index === 0) {
        println(`${paint(ANSI.bold, ANSI.green)('INFO')} ${line}`);
        return;
      }
      println(`     ${line}`);
    });
}

export function printWarn(text: string): void {
  String(text)
    .split('\n')
    .forEach((line, index) => {
      if (index === 0) {
        println(`${paint(ANSI.bold, ANSI.yellow)('WARN')} ${paint(ANSI.yellow)(line)}`, process.stderr);
        return;
      }
      println(`     ${paint(ANSI.yellow)(line)}`, process.stderr);
    });
}

export function printFail(text: string): void {
  String(text)
    .split('\n')
    .forEach((line, index) => {
      if (index === 0) {
        println(`${paint(ANSI.bold, ANSI.red)('FAIL')} ${paint(ANSI.red)(line)}`, process.stderr);
        return;
      }
      println(`     ${paint(ANSI.red)(line)}`, process.stderr);
    });
}

export function printDebug(text: string): void {
  if (process.env.NODE_ENV === 'production' && !process.env.VERBOSE) {
    return;
  }
  println(paint(ANSI.brightBlack)(text), process.stderr);
}
