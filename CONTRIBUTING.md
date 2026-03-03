# 贡献指南

感谢你对 cmdx 的兴趣！本指南将帮助你参与项目贡献。

## 🚀 快速开始

### 1. Fork 和克隆

```bash
# Fork 项目
# 在 GitHub 上点击 Fork 按钮

# 克隆到本地
git clone https://github.com/YOUR_USERNAME/cmdx.git
cd cmdx

# 添加上游仓库
git remote add upstream https://github.com/miserylee/cmdx.git
```

### 2. 安装依赖

```bash
# 安装 pnpm（如果未安装）
npm install -g pnpm

# 安装项目依赖
pnpm install

# 安装工具链
cd tools && pnpm install
```

### 3. 构建项目

```bash
# 构建所有包
pnpm run build

# 或单独构建
cd packages/core && pnpm run build
```

### 4. 运行测试

```bash
# 运行所有测试
pnpm run test

# 运行特定包的测试
cd packages/printer && pnpm run test
```

## 📝 提交规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Type

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

### 示例

```bash
# 新功能
feat(core): 添加新的插件钩子

# Bug 修复
fix(parse): 修复长参数解析问题

# 文档
docs(readme): 更新快速开始示例

# 重构
refactor(printer): 优化响应式输出性能
```

## 🔧 开发流程

### 1. 创建分支

```bash
# 从主分支创建新分支
git checkout -b feat/your-feature-name main
```

### 2. 开发和测试

```bash
# 编写代码
# ...

# 运行测试确保通过
pnpm run test

# 构建检查
pnpm run build
```

### 3. 提交代码

```bash
# 添加更改
git add .

# 提交（遵循提交规范）
git commit -m "feat(core): add new feature"

# 推送分支
git push origin feat/your-feature-name
```

### 4. 创建 Pull Request

1. 在 GitHub 上创建 Pull Request
2. 填写 PR 描述，说明：
   - 做了什么改动
   - 为什么需要这个改动
   - 如何测试
3. 等待 Code Review
4. 根据反馈修改
5. 合并

## 🐛 报告 Bug

### Bug 报告模板

```markdown
**问题描述**
清晰简洁地描述问题

**复现步骤**
1. 执行 '...'
2. 看到错误 '...'

**期望行为**
清晰简洁地描述期望发生什么

**实际行为**
清晰简洁地描述实际发生什么

**环境信息**
- OS: [e.g. macOS 14.0]
- Node.js: [e.g. 18.0.0]
- cmdx: [e.g. 0.5.0]

**附加信息**
任何有助于解决问题的截图或日志
```

## 💡 功能建议

### 功能建议模板

```markdown
**功能描述**
清晰简洁地描述建议的功能

**使用场景**
描述这个功能能解决什么问题

**实现建议**
如果有，描述可能的实现方式

**替代方案**
描述考虑过的其他方案
```

## 📦 发布流程

### 版本号规范

遵循 [Semantic Versioning](https://semver.org/)：

- `MAJOR.MINOR.PATCH` (e.g. 1.2.3)
- MAJOR: 不兼容的 API 变更
- MINOR: 向后兼容的功能新增
- PATCH: 向后兼容的问题修复

### 发布步骤

```bash
# 更新版本号（使用 lerna）
pnpm run release

# 或手动更新
# 1. 更新 package.json 中的 version
# 2. 更新 CHANGELOG.md
# 3. 提交并打 tag
# 4. 发布到 npm
```

## 🎨 代码风格

### ESLint

项目使用 ESLint 进行代码检查：

```bash
# 运行 lint
pnpm run lint

# 自动修复
pnpm run lint -- --fix
```

### TypeScript

- 使用严格模式
- 避免使用 `any`
- 为函数和变量添加类型注解

### 命名规范

```typescript
// 类：PascalCase
class App { }

// 函数/变量：camelCase
function parseCommand() { }
const context = { };

// 常量：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// 类型：PascalCase
interface CommandSchema { }
type FlagValue = string | boolean;

// 私有成员：以下划线开头
private _internalState = { };
```

## 📚 文档

### 文档要求

- 使用中文编写（代码注释可用英文）
- 提供示例代码
- 保持更新

### 文档结构

```
docs/
├── getting-started.md    # 入门指南
├── api/                  # API 文档
│   ├── app.md
│   ├── context.md
│   └── plugins.md
├── guides/               # 使用指南
│   ├── commands.md
│   ├── flags.md
│   └── plugins.md
└── examples/             # 示例代码
```

## 🧪 测试

### 测试要求

- 新功能必须包含测试
- Bug 修复应添加回归测试
- 测试覆盖率应逐步提高

### 测试框架

使用 [Vitest](https://vitest.dev/)：

```typescript
import { describe, it, expect } from 'vitest';

describe('parse', () => {
  it('should parse long flag with = sign', () => {
    // 测试代码
  });
});
```

### 运行测试

```bash
# 运行所有测试
pnpm run test

# 运行特定测试文件
pnpm run test -- parse.test.ts

# 覆盖率报告
pnpm run test:cov
```

## 🤔 常见问题

### Q: 如何本地测试 CLI？

```bash
# 链接本地包
cd packages/launcher
pnpm link --global

# 在其他项目中使用
cmdx your-command
```

### Q: 如何调试？

```bash
# 设置环境变量
NODE_ENV=development node src/index.ts

# 或使用调试器
node --inspect src/index.ts
```

### Q: 如何添加新插件？

参考现有插件实现，如 `packages/core/src/plugins/help.ts`。

## 📞 联系方式

- GitHub Issues: https://github.com/miserylee/cmdx/issues
- Email: miserylee@foxmail.com

---

感谢你的贡献！🎉
