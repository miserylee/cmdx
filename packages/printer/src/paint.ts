export enum ANSI {
  reset,
  bold,
  faint,
  italic,
  underline,
  slowBlink,
  rapidBlink,
  inverse,
  conceal,
  crossedOut,
  primary,
  resetWeight = 22,
  resetItalic,
  resetUnderline,
  resetBlink,
  resetInverse = 27,
  resetConceal,
  resetCrossedOut,
  black,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  resetFGColor = 39,
  blackBG,
  redBG,
  greenBG,
  yellowBG,
  blueBG,
  magentaBG,
  cyanBG,
  whiteBG,
  resetBGColor = 49,
  brightBlack = 90,
  brightRed,
  brightGreen,
  brightYellow,
  brightBlue,
  brightMagenta,
  brightCyan,
  brightWhite,
  brightBlackBG = 100,
  brightRedBG,
  brightGreenBG,
  brightYellowBG,
  brightBlueBG,
  brightMagentaBG,
  brightCyanBG,
  brightWhiteBG,
}

const RESET = `\x1b[${ANSI.reset}m`;

export function paint(...code: ANSI[]): (text: string) => string {
  if (!process.stdout.isTTY) {
    return (text) => text;
  }
  const style = `\x1b[0;${code.join(';')}m`;
  return (text: string) => {
    text = String(text).replace(/\u001b\[0m/g, style);
    return `${style}${text}${RESET}`;
  };
}
