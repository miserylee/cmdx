import { ANSI, createReactiveLog, paint } from '../src';

const log1 = createReactiveLog({
  initialState: { cost: 0 },
  render(state) {
    return paint(ANSI.brightBlack)(`${state.cost}ms`);
  },
});

const log2 = createReactiveLog({
  initialState: {},
  render() {
    return ['Total time cost: ', log1];
  },
});

log2.print();

const start = Date.now();

const t = setInterval(() => {
  const cost = Date.now() - start;
  log1.update({
    cost,
  });
  if (cost > 1000) {
    log2.freeze();
    clearInterval(t);
  }
}, 100);
