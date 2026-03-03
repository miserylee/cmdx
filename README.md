# cmdx

> command X everything - 一个灵活的 TypeScript CLI 框架

[![npm version](https://img.shields.io/npm/v/@cmdx/launcher.svg)](https://www.npmjs.com/package/@cmdx/launcher)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![Alt](https://repobeats.axiom.co/api/embed/85ffe9b9d66ea4c8323593ef68d06150638b2aa3.svg "Repobeats analytics image")

## 📖 简介

cmdx 是一个用 TypeScript 编写的 CLI 框架，提供灵活的命令解析、插件系统和模块化架构。它帮助你快速构建功能强大的命令行工具。

## ✨ 特性

- 🚀 **灵活的命令解析** - 支持子命令、参数、标志（长/短格式）
- 🔌 **插件系统** - 可扩展的插件架构，支持 init、beforeParse、afterParse、beforeExecute、afterExecute 等钩子
- 📦 **模块化设计** - 支持模块加载和复用，可拆分大型项目
- 🎨 **响应式输出** - 支持动态更新的终端输出（进度条、列表等）
- 📝 **自动生成帮助** - 根据 schema 自动生成帮助信息
- 🛠️ **TypeScript 优先** - 完整的类型定义，开发体验友好

## 📦 安装

```bash
# 安装启动器
npm install -g @cmdx/launcher

# 或作为依赖安装
npm install @cmdx/core @cmdx/printer
```

## 🚀 快速开始

### 1. 创建基础项目

```bash
mkdir my-cli && cd my-cli
npm init -y
npm install @cmdx/core @cmdx/printer
```

### 2. 创建命令 Schema

创建 `src/schema.ts`：

```typescript
import { type CommandSchema } from '@cmdx/core';
import { printInfo } from '@cmdx/printer';

export default {
  commands: {
    greet: {
      description: 'Greet someone',
      arguments: [
        {
          name: 'name',
          description: 'The name to greet',
        },
      ],
      flags: {
        loud: {
          shorten: 'l',
          description: 'Greet loudly',
        },
      },
      action: async (context) => {
        const { name } = context.arguments;
        const { loud } = context.flags;
        
        const message = `Hello, ${name}!`;
        printInfo(loud ? message.toUpperCase() : message);
      },
    },
  },
} satisfies CommandSchema;
```

### 3. 创建入口文件

创建 `src/index.ts`：

```typescript
import { App } from '@cmdx/core';
import schema from './schema';

const app = new App('my-cli');
app.installMod({ name: 'my-cli', schema });
app.execute();
```

### 4. 运行

```bash
# 使用 ts-node 或编译后运行
npx ts-node src/index.ts greet World
# 输出：Hello, World!

npx ts-node src/index.ts greet World --loud
# 输出：HELLO, WORLD!

npx ts-node src/index.ts --help
# 自动显示帮助信息
```

## 📚 核心概念

### CommandSchema

命令 schema 是 cmdx 的核心，定义了命令的结构：

```typescript
interface CommandSchema {
  description?: string;           // 命令描述
  commands?: { [name: string]: CommandSchema };  // 子命令
  arguments?: ArgumentSchema[];   // 参数列表
  flags?: { [name: string]: FlagSchema };        // 标志
  action?: Action;                // 执行函数
  hidden?: boolean;               // 是否隐藏在帮助中
}
```

### 参数 (Arguments)

```typescript
{
  name: 'file',                    // 参数名
  description: 'Input file',       // 描述
  optional?: boolean,              // 是否可选
  variadic?: boolean,              // 是否允许多个值
  choices?: string[],              // 可选值
  default?: string | string[],     // 默认值
}
```

### 标志 (Flags)

```typescript
{
  shorten?: string,                // 短格式，如 '-h'
  description?: string,            // 描述
  required?: boolean,              // 是否必填
  valueRequired?: boolean,         // 是否需要值
  variadic?: boolean,              // 是否可多次使用
  choices?: string[],              // 可选值
  default?: any,                   // 默认值
  hidden?: boolean,                // 是否隐藏
}
```

## 🔌 插件系统

cmdx 提供丰富的插件钩子：

```typescript
app.installPlugin({
  name: 'my-plugin',
  apply(hooks) {
    hooks.init((context) => {
      // 初始化阶段
    });
    
    hooks.beforeParse((context) => {
      // 解析命令前
    });
    
    hooks.afterParse((context) => {
      // 解析命令后
    });
    
    hooks.beforeExecute((context) => {
      // 执行命令前
    });
    
    hooks.afterExecute((context) => {
      // 执行命令后
    });
    
    hooks.beforeHandleError((context) => {
      // 处理错误前
    });
  },
});
```

## 📦 模块化

### 内联模块

```typescript
app.installMod({
  name: 'my-mod',
  schema: {
    commands: {
      foo: { action: async () => { ... } }
    }
  }
});
```

### 从文件加载

```typescript
app.installMod('./path/to/mod');
```

### 配置式加载

创建 `.cmdxrc.json`：

```json
{
  "mods": [
    "./mods/greet",
    "./mods/build"
  ]
}
```

## 🎨 响应式输出

使用 `createReactiveLog` 创建动态输出：

```typescript
import { createReactiveLog } from '@cmdx/printer';

const log = createReactiveLog({
  initialState: { progress: 0 },
  render(state) {
    const bar = '█'.repeat(state.progress) + '░'.repeat(10 - state.progress);
    return `[${bar}] ${state.progress * 10}%`;
  },
});

log.print();
log.update(prev => ({ progress: prev.progress + 1 }));
```

## 🛠️ API 参考

### App 类

```typescript
class App {
  constructor(name?: string);
  
  installMod(mod: string | Mod): this;
  installPlugin(plugin: Plugin): this;
  execute(options?: AppExecuteOptions): Promise<void>;
}
```

### Context 对象

```typescript
interface Context {
  cwd: string;
  name: string;
  argv: string[];
  subcommands: string[];
  arguments: Record<string, ArgumentValue>;
  flags: Record<string, FlagValue>;
  unknownArguments: string[];
  unknownFlags: Record<string, FlagValue>;
  unknownShortenFlags: Record<string, FlagValue>;
  action?: Action;
  hintSchema: CommandSchema;
  errors: NormalizedError[];
}
```

## 📋 示例项目

查看 [@cmdx/example](packages/example) 获取更多示例：

```bash
# 进度条示例
cmdx ping

# 隐藏命令
cmdx bingo
```

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与。

### 开发设置

```bash
# 克隆仓库
git clone https://github.com/miserylee/cmdx.git
cd cmdx

# 安装依赖
pnpm install

# 构建
pnpm run build

# 测试
pnpm run test

# 本地测试
cd packages/example
pnpm link @cmdx/core @cmdx/printer
```

## 📄 许可证

[MIT License](LICENSE)

## 🔗 相关链接

- [npm](https://www.npmjs.com/package/@cmdx/launcher)
- [GitHub Issues](https://github.com/miserylee/cmdx/issues)
- [CHANGELOG](CHANGELOG.md)

---

**Made with ❤️ by [Misery Lee](https://github.com/miserylee)**
