/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import { classNameFactory } from "@api/Styles";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Forms } from "@webpack/common";

const cl = classNameFactory("");
const Classes = findByPropsLazy("animating", "baseLayer", "bg", "layer", "layers");

const lazyLayers: any[] = [];

export default definePlugin({
    name: "FastMenu",
    description: "Makes the settings menu open faster.",
    authors: [Devs.Kyuu],

    patches: [
        {
            find: "this.renderArtisanalHack()",
            replacement: [
                { // Fade in on layer
                    match: /(?<=(\w+)\.contextType=\w+\.AccessibilityPreferencesContext;)/,
                    replace: "$1=$self.Layer;",
                },
                { // Grab lazy-loaded layers
                    match: /webpackId:("\d+"),name:("\w+")/g,
                    replace: "$&,_:$self.lazyLayer($1,$2)",
                },
            ],
        },
        // For some reason standardSidebarView also has a small fade-in
        {
            find: "},DefaultCustomContentScroller:function(){return ",
            replacement: {
                match: /(?<=Fragment,\{children:)\w+\(\((\w+),\w+\)=>(\(0,\w+\.jsxs\))\(\w+\.animated\.div,\{style:\1,/,
                replace: "($2(\"div\",{"
            }
        }
    ],

    Layer({ mode, baseLayer = false, ...props }) {
        const hidden = mode === "HIDDEN";
        const node = <div
            aria-hidden={hidden}
            className={cl({
                [Classes.layer]: true,
                [Classes.baseLayer]: baseLayer,
                "stop-animations": hidden,
            })}
            style={{ visibility: hidden ? "hidden" : "visible" }}
            {...props}
        />;
        if (baseLayer) return node;
        else return <Forms.FormTitle>{node}</Forms.FormTitle>;
    },

    lazyLayer(moduleId, name) {
        if (name !== "CollectiblesShop")
            lazyLayers.push(moduleId);
    }
});