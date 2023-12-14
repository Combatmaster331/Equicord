#!/usr/bin/node
/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import esbuild from "esbuild";
import { readdir } from "fs/promises";
import { join } from "path";

import { BUILD_TIMESTAMP, commonOpts, existsAsync, globPlugins, isDev, isStandalone, updaterDisabled, VERSION, watch } from "./common.mjs";

const defines = {
    IS_STANDALONE: isStandalone,
    IS_DEV: JSON.stringify(isDev),
    IS_UPDATER_DISABLED: updaterDisabled,
    IS_WEB: false,
    IS_EXTENSION: false,
    VERSION: JSON.stringify(VERSION),
    BUILD_TIMESTAMP,
};
if (defines.IS_STANDALONE === "false")
    // If this is a local build (not standalone), optimise
    // for the specific platform we're on
    defines["process.platform"] = JSON.stringify(process.platform);

/**
 * @type {esbuild.BuildOptions}
 */
const nodeCommonOpts = {
    ...commonOpts,
    format: "cjs",
    platform: "node",
    target: ["esnext"],
    external: ["electron", "original-fs", "~pluginNatives", ...commonOpts.external],
    define: defines,
};

const sourceMapFooter = s => watch ? "" : `//# sourceMappingURL=vencord://${s}.js.map`;
const sourcemap = watch ? "inline" : "external";

/**
 * @type {import("esbuild").Plugin}
 */
const globNativesPlugin = {
    name: "glob-natives-plugin",
    setup: build => {
        const filter = /^~pluginNatives$/;
        build.onResolve({ filter }, args => {
            return {
                namespace: "import-natives",
                path: args.path
            };
        });

        build.onLoad({ filter, namespace: "import-natives" }, async () => {
            const pluginDirs = ["plugins", "userplugins"];
            let code = "";
            let natives = "\n";
            let i = 0;
            for (const dir of pluginDirs) {
                const dirPath = join("src", dir);
                if (!await existsAsync(dirPath)) continue;
                const plugins = await readdir(dirPath);
                for (const p of plugins) {
                    const nativePath = join(dirPath, p, "native.ts");
                    const indexNativePath = join(dirPath, p, "native/index.ts");

                    if (!(await existsAsync(nativePath)) && !(await existsAsync(indexNativePath)))
                        continue;

                    const nameParts = p.split(".");
                    const namePartsWithoutTarget = nameParts.length === 1 ? nameParts : nameParts.slice(0, -1);
                    // pluginName.thing.desktop -> PluginName.thing
                    const cleanPluginName = p[0].toUpperCase() + namePartsWithoutTarget.join(".").slice(1);

                    const mod = `p${i}`;
                    code += `import * as ${mod} from "./${dir}/${p}/native";\n`;
                    natives += `${JSON.stringify(cleanPluginName)}:${mod},\n`;
                    i++;
                }
            }
            code += `export default {${natives}};`;
            return {
                contents: code,
                resolveDir: "./src"
            };
        });
    }
};

await Promise.all([
    // Discord Desktop main & renderer & preload
    esbuild.build({
        ...nodeCommonOpts,
        entryPoints: ["src/main/index.ts"],
        outfile: "dist/patcher.js",
        footer: { js: "//# sourceURL=VencordPatcher\n" + sourceMapFooter("patcher") },
        sourcemap,
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: true,
            IS_VESKTOP: false
        },
        plugins: [
            ...nodeCommonOpts.plugins,
            globNativesPlugin
        ]
    }),
    esbuild.build({
        ...commonOpts,
        entryPoints: ["src/Vencord.ts"],
        outfile: "dist/renderer.js",
        format: "iife",
        target: ["esnext"],
        footer: { js: "//# sourceURL=VencordRenderer\n" + sourceMapFooter("renderer") },
        globalName: "Vencord",
        sourcemap,
        plugins: [
            globPlugins("discordDesktop"),
            ...commonOpts.plugins
        ],
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: true,
            IS_VESKTOP: false
        }
    }),
    esbuild.build({
        ...nodeCommonOpts,
        entryPoints: ["src/preload.ts"],
        outfile: "dist/preload.js",
        footer: { js: "//# sourceURL=VencordPreload\n" + sourceMapFooter("preload") },
        sourcemap,
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: true,
            IS_VESKTOP: false
        }
    }),

    // Vencord Desktop main & renderer & preload
    esbuild.build({
        ...nodeCommonOpts,
        entryPoints: ["src/main/index.ts"],
        outfile: "dist/vencordDesktopMain.js",
        footer: { js: "//# sourceURL=VencordDesktopMain\n" + sourceMapFooter("vencordDesktopMain") },
        sourcemap,
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: false,
            IS_VESKTOP: true
        },
        plugins: [
            ...nodeCommonOpts.plugins,
            globNativesPlugin
        ]
    }),
    esbuild.build({
        ...commonOpts,
        entryPoints: ["src/Vencord.ts"],
        outfile: "dist/vencordDesktopRenderer.js",
        format: "iife",
        target: ["esnext"],
        footer: { js: "//# sourceURL=VencordDesktopRenderer\n" + sourceMapFooter("vencordDesktopRenderer") },
        globalName: "Vencord",
        sourcemap,
        plugins: [
            globPlugins("vencordDesktop"),
            ...commonOpts.plugins
        ],
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: false,
            IS_VESKTOP: true
        }
    }),
    esbuild.build({
        ...nodeCommonOpts,
        entryPoints: ["src/preload.ts"],
        outfile: "dist/vencordDesktopPreload.js",
        footer: { js: "//# sourceURL=VencordPreload\n" + sourceMapFooter("vencordDesktopPreload") },
        sourcemap,
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: false,
            IS_VESKTOP: true
        }
    }),
]).catch(err => {
    console.error("Build failed");
    console.error(err.message);
    // make ci fail
    if (!commonOpts.watch)
        process.exitCode = 1;
});
