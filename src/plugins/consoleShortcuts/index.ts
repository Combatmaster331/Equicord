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

import { Devs } from "@utils/constants";
import { relaunch } from "@utils/native";
import { canonicalizeMatch, canonicalizeReplace, canonicalizeReplacement } from "@utils/patches";
import definePlugin from "@utils/types";
import * as Webpack from "@webpack";
import { extract, filters, findAll, search } from "@webpack";
import { React, ReactDOM } from "@webpack/common";
import type { ComponentType } from "react";

const WEB_ONLY = (f: string) => () => {
    throw new Error(`'${f}' is Discord Desktop only.`);
};

export default definePlugin({
    name: "ConsoleShortcuts",
    description: "Adds shorter Aliases for many things on the window. Run `shortcutList` for a list.",
    authors: [Devs.Ven],

    getShortcuts() {
        function newFindWrapper(filterFactory: (...props: any[]) => Webpack.FilterFn) {
            const cache = new Map<string, unknown>();

            return function (...filterProps: unknown[]) {
                const cacheKey = String(filterProps);
                if (cache.has(cacheKey)) return cache.get(cacheKey);

                const matches = findAll(filterFactory(...filterProps));

                const result = (() => {
                    switch (matches.length) {
                        case 0: return null;
                        case 1: return matches[0];
                        default:
                            const uniqueMatches = [...new Set(matches)];
                            if (uniqueMatches.length > 1)
                                console.warn(`Warning: This filter matches ${matches.length} modules. Make it more specific!\n`, uniqueMatches);

                            return matches[0];
                    }
                })();
                if (result && cacheKey) cache.set(cacheKey, result);
                return result;
            };
        }

        let fakeRenderWin: WeakRef<Window> | undefined;
        const find = newFindWrapper(f => f);
        const findByProps = newFindWrapper(filters.byProps);
        return {
            ...Vencord.Webpack.Common,
            wp: Vencord.Webpack,
            wpc: Webpack.wreq.c,
            wreq: Webpack.wreq,
            wpsearch: search,
            wpex: extract,
            wpexs: (code: string) => extract(Webpack.findModuleId(code)!),
            find,
            findAll,
            findByProps,
            findAllByProps: (...props: string[]) => findAll(filters.byProps(...props)),
            findByCode: newFindWrapper(filters.byCode),
            findAllByCode: (code: string) => findAll(filters.byCode(code)),
            findComponentByCode: newFindWrapper(filters.componentByCode),
            findAllComponentsByCode: (...code: string[]) => findAll(filters.componentByCode(...code)),
            findExportedComponent: (...props: string[]) => findByProps(...props)[props[0]],
            findStore: newFindWrapper(filters.byStoreName),
            PluginsApi: Vencord.Plugins,
            plugins: Vencord.Plugins.plugins,
            Settings: Vencord.Settings,
            Api: Vencord.Api,
            reload: () => location.reload(),
            restart: IS_WEB ? WEB_ONLY("restart") : relaunch,
            canonicalizeMatch,
            canonicalizeReplace,
            canonicalizeReplacement,
            fakeRender: (component: ComponentType, props: any) => {
                const prevWin = fakeRenderWin?.deref();
                const win = prevWin?.closed === false ? prevWin : window.open("about:blank", "Fake Render", "popup,width=500,height=500")!;
                fakeRenderWin = new WeakRef(win);
                win.focus();

                const doc = win.document;
                doc.body.style.margin = "1em";

                if (!win.prepared) {
                    win.prepared = true;

                    [...document.querySelectorAll("style"), ...document.querySelectorAll("link[rel=stylesheet]")].forEach(s => {
                        const n = s.cloneNode(true) as HTMLStyleElement | HTMLLinkElement;

                        if (s.parentElement?.tagName === "HEAD")
                            doc.head.append(n);
                        else if (n.id?.startsWith("vencord-") || n.id?.startsWith("vcd-"))
                            doc.documentElement.append(n);
                        else
                            doc.body.append(n);
                    });
                }

                ReactDOM.render(React.createElement(component, props), doc.body.appendChild(document.createElement("div")));
            }
        };
    },

    start() {
        const shortcuts = this.getShortcuts();
        window.shortcutList = shortcuts;
        for (const [key, val] of Object.entries(shortcuts))
            window[key] = val;
    },

    stop() {
        delete window.shortcutList;
        for (const key in this.getShortcuts())
            delete window[key];
    }
});
