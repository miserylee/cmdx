import * as process from 'node:process';

import { supportsHyperlink } from 'supports-hyperlinks';

import { ANSI, paint } from './paint';

const OSC = '\u001B]';
const BEL = '\u0007';
const SEP = ';';

export function link(text: string, url: string): string {
  if (link.isSupported) {
    return [OSC, '8', SEP, SEP, url, BEL, text, OSC, '8', SEP, SEP, BEL].join('');
  }
  return paint(ANSI.brightBlue, ANSI.underline)(`[${text}](${url})`);
}

link.isSupported = supportsHyperlink(process.stdout);
