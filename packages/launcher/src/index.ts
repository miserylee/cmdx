import crypto from 'crypto';
import { spawnSync } from 'node:child_process';
import * as os from 'node:os';
import path from 'node:path';

import { App, type Context } from '@cmdx/core';
import { printDebug, printInfo, printWarn } from '@cmdx/printer';
import findup from 'find-up';
import fs from 'fs-extra';
import json5 from 'json5';

const configFilename = '.cmdxrc.json';

export interface CmdxLauncherConfig {
  mods: string[];
  npmRegistry?: string;
}

function findWorkspaceRoot(cwd: string) {
  printDebug(`Find workspace from cwd: ${cwd}`);
  return (
    findup.sync(
      (directory) => {
        const match = fs.existsSync(path.resolve(directory, configFilename));
        return match ? directory : undefined;
      },
      {
        cwd,
        type: 'directory',
      }
    ) || path.resolve(os.homedir(), '.cmdx')
  );
}

function readConfig(root: string): CmdxLauncherConfig {
  const defaultValue: CmdxLauncherConfig = {
    mods: [],
  };
  const fullConfigFilename = path.resolve(root, configFilename);
  if (!fs.existsSync(fullConfigFilename)) {
    fs.ensureFileSync(fullConfigFilename);
    fs.writeJSONSync(fullConfigFilename, defaultValue);
    return defaultValue;
  }
  const config = json5.parse(fs.readFileSync(fullConfigFilename, 'utf-8'));
  return {
    ...defaultValue,
    ...config,
  };
}

const app = new App();

app
  .installPlugin({
    name: 'defaultHelp',
    apply: async (hook) => {
      hook.afterParse(async (context) => {
        if (!context.hintSchema.action) {
          context.unknownShortenFlags['h'] = true;
        }
      });
    },
  })
  .installPlugin({
    name: 'loadConfig',
    apply(hooks) {
      hooks.init(async (context) => {
        const root = findWorkspaceRoot(context.cwd);
        printDebug(`Found workspace root at: ${root}`);
        context.state.root = root;
        context.state.config = readConfig(root);
      });
    },
  })
  .installPlugin({
    name: 'loadMods',
    apply: async (hooks) => {
      const finalMods: string[] = [];

      hooks.init(
        async (
          context: Context<
            object,
            object,
            {
              root: string;
              config: CmdxLauncherConfig;
            }
          >
        ) => {
          const root = context.state.root;
          const config = context.state.config;

          // process mods
          const mods =
            config.mods.map((mod) => {
              if (mod.startsWith('npm:')) {
                return mod;
              }
              if (mod.startsWith('.') || mod.startsWith('/')) {
                // from local package
                return path.resolve(root, mod);
              }
              return `npm:${mod}`;
            }) ?? [];

          const cacheDir = root.endsWith('/.cmdx')
            ? path.resolve(root, 'mods')
            : path.resolve(root, '.cmdx/mods');
          fs.ensureDirSync(cacheDir);

          const pkgJson = {
            dependencies: mods.reduce<Record<string, string>>((acc, mod) => {
              if (!mod.startsWith('npm:')) {
                finalMods.push(mod);
                return acc;
              }
              const [pkgName, version = '*'] = mod.slice(4).split(':');
              finalMods.push(path.resolve(cacheDir, 'node_modules', pkgName));
              acc[pkgName] = version;
              return acc;
            }, {}),
          };

          const shouldInstallMods = Object.keys(pkgJson.dependencies).length > 0;
          if (!shouldInstallMods) {
            return;
          }

          const hash = crypto.createHash('md5').update(JSON.stringify(pkgJson)).digest('hex');
          const hashFilename = path.resolve(cacheDir, 'hash');
          if (fs.existsSync(hashFilename)) {
            const prevHash = fs.readFileSync(path.resolve(cacheDir, 'hash'), 'utf-8');
            if (prevHash === hash) {
              return;
            }
          }

          printInfo('Install mods from npm');
          if (config.npmRegistry) {
            printInfo(`Registry: ${config.npmRegistry}`);
          }

          fs.writeJSONSync(path.resolve(cacheDir, 'package.json'), pkgJson);

          spawnSync('npm', ['i', ...(config.npmRegistry ? ['--registry', config.npmRegistry] : [])], {
            cwd: cacheDir,
          });

          // 成功后才写入 hash
          fs.writeFileSync(hashFilename, hash);
        }
      );

      hooks.init(async () => {
        await Promise.all(
          finalMods.map(async (mod) => {
            try {
              let modName = 'unknown';
              if (fs.statSync(mod).isDirectory()) {
                const pkgJson = fs.readJSONSync(path.resolve(mod, 'package.json'));
                modName = pkgJson.name ?? path.parse(mod).name;
              }
              let schema = await import(mod);
              if ('default' in schema) {
                schema = schema.default;
              }
              if (!schema || typeof schema !== 'object') {
                schema = {};
              }

              app.installMod({
                name: modName,
                schema,
              });
            } catch (e) {
              printWarn(`Install mod failed from ${mod}`);
              if (process.env.VERBOSE) {
                console.error(e);
              }
            }
          })
        );
      });
    },
  });

export default app;
