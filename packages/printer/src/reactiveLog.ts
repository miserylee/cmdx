import readline from 'readline';
import { type WriteStream } from 'tty';

import wrapAnsi from 'wrap-ansi';

import { println } from './print';
import { purify } from './processText';

type SpiedWriteStream = WriteStream & { _originalWrite?: WriteStream['write'] };

function spyStream(stream: SpiedWriteStream) {
  if (stream._originalWrite) {
    // already spied
    return;
  }
  stream._originalWrite = stream.write.bind(stream);
  // proxy write
  Object.defineProperty(stream, 'write', {
    set(value) {
      stream._originalWrite = value;
    },
    get() {
      return (...args: Parameters<WriteStream['write']>) => {
        stream.emit('beforeData');
        stream._originalWrite!(...args);
        stream.emit('afterData');
      };
    },
  });
}

type SpiedReadline = typeof readline & { _spied?: boolean; _isPrompting?: boolean };

function spyReadline() {
  const spiedReadline = readline as SpiedReadline;
  if (spiedReadline._spied) {
    return;
  }
  const originalCreateInterface = readline.createInterface.bind(readline);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spiedReadline.createInterface = (...args: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rl = (originalCreateInterface as any)(...args);
    spiedReadline._isPrompting = true;
    rl.on('close', () => {
      spiedReadline._isPrompting = false;
    });
    return rl;
  };
  spiedReadline._spied = true;
}

function spyStdio() {
  spyStream(process.stdout);
  spyStream(process.stderr);
  spyReadline();
}

function eraseLines(count: number) {
  if (count <= 0) {
    return '';
  }
  const eraseLineCtrl = `\u001B[2K`;
  const cursorUpCtrl = `\u001B[1A`;
  const cursorLeftCtrl = `\u001B[G`;
  const ctrls: string[] = [];
  for (let i = 0; i < count; i += 1) {
    ctrls.push(eraseLineCtrl);
    if (i < count - 1) {
      ctrls.push(cursorUpCtrl);
    } else {
      ctrls.push(cursorLeftCtrl);
    }
  }
  return ctrls.join('');
}

interface ReactiveLogPrinter {
  repaint(): void;
  clear(): void;
  pause(): void;
  resume(): void;
}

function getPrinter(): ReactiveLogPrinter {
  if (getPrinter._printer) {
    return getPrinter._printer;
  }

  spyStdio();

  let prevLineCount = 0;
  let paused = false;

  const originalWrite = (process.stderr as SpiedWriteStream)._originalWrite!;

  const printer: ReactiveLogPrinter = {
    repaint() {
      if (paused || (readline as SpiedReadline)._isPrompting || !printReactiveLog._root) {
        return;
      }
      const lines = printReactiveLog._root.getSnapshot();
      let wrappedLines = wrapAnsi(lines, (process.stderr.columns || 80) - 2, {
        trim: false,
        hard: true,
        wordWrap: false,
      });
      if (wrappedLines) {
        wrappedLines += '\n';
      }
      if (process.stderr.isTTY) {
        const data = eraseLines(prevLineCount) + wrappedLines;
        originalWrite(data);
        prevLineCount = wrappedLines.split('\n').length;
      } else {
        originalWrite(purify(wrappedLines));
      }
    },
    clear() {
      if (paused || (readline as SpiedReadline)._isPrompting || !process.stdout.isTTY) {
        return;
      }
      originalWrite(eraseLines(prevLineCount));
      prevLineCount = 0;
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
  };

  function listen() {
    // 当有其他输出时，清除响应式日志，在最底部重绘
    [process.stderr, process.stdout].forEach((stream) => {
      const beforeDataCb = () => {
        if (paused) {
          prevLineCount = 0;
          return;
        }
        printer.clear();
      };
      const afterDataCb = () => {
        if (paused) {
          return;
        }
        printer.repaint();
      };
      stream.on('beforeData', beforeDataCb);
      stream.on('afterData', afterDataCb);
      process.on('beforeExit', () => {
        stream.off('beforeData', beforeDataCb);
        stream.off('afterData', afterDataCb);
      });
    });
  }
  listen();

  getPrinter._printer = printer;
  return printer;
}

getPrinter._printer = null as ReactiveLogPrinter | null;

function printReactiveLog(log: ReactiveLog) {
  const root =
    printReactiveLog._root ||
    (printReactiveLog._root = createReactiveLog<{ logs: ReactiveLog[] }>({
      initialState: { logs: [] },
      render: (state) => state.logs,
    }));
  root.update((prev) => {
    if (prev.logs.includes(log)) {
      return prev;
    }
    return {
      logs: [...prev.logs, log],
    };
  });

  getPrinter().repaint();
}

printReactiveLog._root = null as ReactiveLog<{ logs: ReactiveLog[] }> | null;

function clearReactiveLog(log: ReactiveLog) {
  const root = printReactiveLog._root;
  if (!root) {
    return;
  }
  root.update((prev) => {
    if (!prev.logs.includes(log)) {
      return prev;
    }
    const nextLogs = prev.logs.filter((item) => item !== log);
    return {
      logs: nextLogs,
    };
  });
}

export interface ReactiveLog<T extends object = object> {
  print(): void;
  update(updater: Partial<T> | ((prevState: T) => Partial<T>)): void;
  pause(): void;
  resume(): void;
  freeze(): void;
  clear(): void;
  getSnapshot(): string;
  shouldRepaint(): boolean;
  getState(): T;
}

export interface CreateReactiveLogOptions<T> {
  render(state: T): string | (string | ReactiveLog)[];
  initialState: T;
}

export function createReactiveLog<T extends object = object>(
  options: CreateReactiveLogOptions<T>
): ReactiveLog<T> {
  let frozen = false;
  let state = options.initialState;
  let shouldUpdate = true;
  let snapshot = '';
  let children: ReactiveLog[] = [];
  return {
    getState() {
      return state;
    },
    getSnapshot(): string {
      const shouldChildrenUpdate = children.some((child) => child.shouldRepaint());
      if (!shouldUpdate && !shouldChildrenUpdate) {
        return snapshot;
      }

      const result = options.render(state);
      if (typeof result === 'string') {
        snapshot = result;
      } else {
        children = result.filter((child) => typeof child !== 'string');
        snapshot = result
          .map((child) => {
            return typeof child === 'string' ? child : child.getSnapshot();
          })
          .filter(Boolean)
          .join('');
      }
      return snapshot;
    },
    print() {
      if (frozen) {
        return;
      }
      printReactiveLog(this);
    },
    update(updater) {
      if (frozen) {
        return;
      }
      let nextState: T;
      if (updater instanceof Function) {
        nextState = {
          ...state,
          ...updater(state),
        };
      } else {
        nextState = {
          ...state,
          ...updater,
        };
      }
      // if state not changed, skip repaint
      const nextStateKeys = Object.keys(nextState);
      const prevStateKeys = Object.keys(state);
      if (
        nextStateKeys.length === prevStateKeys.length &&
        nextStateKeys.every((key) => Reflect.get(nextState, key) === Reflect.get(state, key))
      ) {
        return;
      }
      state = nextState;
      shouldUpdate = true;
      getPrinter().repaint();
    },
    pause() {
      getPrinter().pause();
    },
    resume() {
      getPrinter().resume();
    },
    freeze() {
      if (frozen) {
        return;
      }
      frozen = true;
      println(this.getSnapshot());
      clearReactiveLog(this);
    },
    clear() {
      clearReactiveLog(this);
    },
    shouldRepaint(): boolean {
      return shouldUpdate;
    },
  };
}
