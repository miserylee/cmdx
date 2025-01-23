# `@cmdx/core`

一个简单高性能的 CLI 基础库。

# 特性
- 命令代码懒加载，避免启动时性能问题，提高用户体验
- 支持插件拓展，在多个生命周期插入自定义逻辑，增强纵向能力
- 支持模组拓展，通过模组快速拓展命令，业务功能条理清晰
- 完备的类型定义，简洁易懂的 API 设计，使用起来非常友好

# 基本使用
```typescript
import { App } from '@cmdx/core';

// 创建应用实例
const app = new App();

// 安装模组（内联）
app.installMod({
  name: 'example',
  schema: {
    commands: {
      ping: {
        action: async () => {
          console.log('pong');
        },
      },
    },
  },
});

// 安装模组（动态）
// ./foo 文件导出了一个完整的 Mod 结构
app.installMod(require.resolve('./foo'));

// 安装模组（模组包）
// ‘my-cli-mod’ 包导出了一个完整的 Mod 结构
app.installMod('my-cli-mod');

// 安装插件
// myPlugin 是一个 Plugin 对象
app.installPlugin(myPlugin);

// 执行 cli，消费 argv 作为入参
app.execute();

// 执行 cli，显示传入 argv
app.execute({
  args: ['foo', 'bar'],
});

```

# 插件
CLI 命令执行的生命周期如下：
- hook: init
- hook: beforeParse
- *parse*
- hook: afterParse
- hook: beforeExecute
- *execute*
- hook: afterExecute
- hook: beforeHandleError

插件的作用是在上面的生命周期中，对 hooks 进行逻辑拓展  
插件的定义如下：

```typescript
export type PluginHookAction = (context: Context) => Promise<void>;
export type PluginHook = (action: PluginHookAction) => void;

export interface PluginHooks {
  init: PluginHook;
  beforeParse: PluginHook;
  afterParse: PluginHook;
  beforeExecute: PluginHook;
  afterExecute: PluginHook;
  beforeHandleError: PluginHook;
}

/**
 * Plugin is the way to add more features to the cli which effect all commands
 */
export interface Plugin {
  /**
   * the name of plugin
   */
  name: string;
  /**
   * the implementation of the plugin to be applied by app when execute
   */
  apply: (hooks: PluginHooks) => void;
}
```

编写一个简单的插件如下：
```typescript
export const myPlugin: Plugin = {
  name: 'my-plugin',
  apply: (hooks) => {
    // 在解析命令前执行
    hooks.beforeParse(async (context) => {
      console.log(context);
    });
  },
};

```

# 模组
模组的定义参考 [点击前往查看](https://github.com/miserylee/cmdx/blob/main/packages/core/src/helpers/types.ts#L217)  
编写模组参考「基本使用」一节的示例，本库有完整的代码提示和注释可以参考，这里不过多赘述

# 附
[@cmdx/printer](https://github.com/miserylee/cmdx/blob/main/packages/printer/src/index.ts): 该帮助库提供了一系列终端打印内容的方法，可以直接使用  
[example](https://github.com/miserylee/cmdx/blob/main/packages/example/src/index.ts): 这里提供了一个简单的示例应用以供参考  

[友链 formmy](https://github.com/miserylee/formmy): 一个简单够用的表单辅助库  
[友链 mock-react-component](https://github.com/miserylee/mock-react-component): 单测 mock react 组件的帮助库  
