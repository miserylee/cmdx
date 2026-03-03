# @cmdx/printer

> cmdx 的终端输出工具包 - 提供丰富的终端渲染能力

[![npm version](https://img.shields.io/npm/v/@cmdx/printer.svg)](https://www.npmjs.com/package/@cmdx/printer)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

## 📖 简介

`@cmdx/printer` 是 cmdx CLI 框架的终端输出工具包，提供丰富的终端渲染能力，包括：

- 🎨 彩色文本
- 📊 表格输出
- 📈 进度条
- 🔗 终端链接
- 📝 响应式日志
- ✨ 文本处理工具

## 📦 安装

```bash
npm install @cmdx/printer
```

## 🚀 快速开始

### 1. 基础文本输出

```typescript
import { printInfo, printError, printWarning, printSuccess } from '@cmdx/printer';

printInfo('这是一条信息');
printError('这是一个错误');
printWarning('这是一个警告');
printSuccess('操作成功！');
```

### 2. 彩色文本

```typescript
import { paint, ANSI } from '@cmdx/printer';

// 使用预设颜色
console.log(paint(ANSI.red)('红色文本'));
console.log(paint(ANSI.green)('绿色文本'));
console.log(paint(ANSI.blue)('蓝色文本'));
console.log(paint(ANSI.yellow)('黄色文本'));

// 组合样式
console.log(paint(ANSI.bold, ANSI.blue)('粗体蓝色'));
console.log(paint(ANSI.italic, ANSI.red)('斜体红色'));
```

### 3. 表格输出

```typescript
import { printTable } from '@cmdx/printer';

printTable({
  head: ['Name', 'Age', 'City'],
  rows: [
    ['Alice', '25', 'New York'],
    ['Bob', '30', 'London'],
    ['Charlie', '35', 'Tokyo'],
  ],
});
```

输出：
```
┌─────────┬─────┬──────────┐
│ Name    │ Age │ City     │
├─────────┼─────┼──────────┤
│ Alice   │ 25  │ New York │
│ Bob     │ 30  │ London   │
│ Charlie │ 35  │ Tokyo    │
└─────────┴─────┴──────────┘
```

### 4. 进度条

```typescript
import { createProgressBar } from '@cmdx/printer';

const progress = createProgressBar({
  total: 100,
  format: '{bar} {percentage}% | {value}/{total}',
});

progress.start();

const timer = setInterval(() => {
  progress.increment(10);
  if (progress.completed) {
    clearInterval(timer);
  }
}, 500);
```

### 5. 响应式日志

```typescript
import { createReactiveLog } from '@cmdx/printer';

const log = createReactiveLog({
  initialState: { count: 0 },
  render(state) {
    return `当前计数：${state.count}`;
  },
});

log.print();

// 更新日志（会覆盖上一行）
setInterval(() => {
  log.update(prev => ({ count: prev.count + 1 }));
}, 1000);
```

### 6. 终端链接

```typescript
import { printLink } from '@cmdx/printer';

// 创建可点击的终端链接
printLink('https://github.com/miserylee/cmdx', '查看 cmdx 项目');
```

### 7. 文本处理工具

```typescript
import { textWidth, padText, purify } from '@cmdx/printer';

// 计算文本宽度（支持中文）
textWidth('hello');        // 5
textWidth('你好');         // 4
textWidth('hello 你好');   // 9

// 填充文本
padText('hello', 10);      // '     hello'
padText('hello', '10^');   // 'hello     '
padText('hello', '$10$');  // '$$$$$hello'

// 移除 ANSI 控制字符
purify('\x1b[31mred text\x1b[0m');  // 'red text'
```

## 📚 API 参考

### 输出函数

| 函数 | 描述 | 示例 |
|------|------|------|
| `printInfo(msg)` | 打印信息（蓝色） | `printInfo('Loading...')` |
| `printError(msg)` | 打印错误（红色） | `printError('Failed!')` |
| `printWarning(msg)` | 打印警告（黄色） | `printWarning('Deprecated')` |
| `printSuccess(msg)` | 打印成功（绿色） | `printSuccess('Done!')` |
| `printDebug(msg)` | 打印调试信息（灰色） | `printDebug('Debug info')` |
| `printLink(url, text?)` | 打印可点击链接 | `printLink('https://...', 'Click')` |

### 样式函数

| 函数 | 描述 | 示例 |
|------|------|------|
| `paint(...styles)(text)` | 应用样式 | `paint(ANSI.red, ANSI.bold)('Text')` |
| `ANSI.red` | 红色 | - |
| `ANSI.green` | 绿色 | - |
| `ANSI.blue` | 蓝色 | - |
| `ANSI.yellow` | 黄色 | - |
| `ANSI.bold` | 粗体 | - |
| `ANSI.italic` | 斜体 | - |
| `ANSI.underline` | 下划线 | - |

### 表格

```typescript
printTable(options: {
  head?: string[];      // 表头
  rows: string[][];     // 数据行
  style?: 'rounded' | 'double' | 'compact';  // 样式
});
```

### 进度条

```typescript
createProgressBar(options: {
  total: number;                    // 总数
  format?: string;                  // 格式模板
  barChar?: string;                 // 进度条字符
  emptyChar?: string;               // 空白字符
  width?: number;                   // 进度条宽度
});

// 方法
progress.start();                   // 开始
progress.increment(value?: number); // 增加
progress.complete();                // 完成
progress.stop();                    // 停止
```

### 响应式日志

```typescript
createReactiveLog<T>({
  initialState: T,
  render: (state: T) => string,
});

// 方法
log.print();                        // 打印初始状态
log.update(fn: (prev: T) => T);    // 更新状态
log.clear();                        // 清除
```

### 文本工具

```typescript
textWidth(text: string): number;           // 计算文本宽度
padText(text: string, format: string | number): string;  // 填充文本
purify(text: string): string;              // 移除 ANSI 字符
```

## 🎨 格式模板

`padText` 支持灵活的格式模板：

| 格式 | 描述 | 示例 |
|------|------|------|
| `10` | 右对齐，宽度 10 | `'     hello'` |
| `10^` | 左对齐，宽度 10 | `'hello     '` |
| `$10$` | 使用 `$` 填充，宽度 10 | `'$$$$$hello'` |
| `中 10 文` | 使用中文填充 | `'中中 hello 文文'` |

## 📋 示例项目

查看 [examples](./examples) 目录获取更多示例代码。

## 🤝 贡献

参考 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 📄 许可证

[MIT License](../../LICENSE)

---

**Made with ❤️ by [Misery Lee](https://github.com/miserylee)**
