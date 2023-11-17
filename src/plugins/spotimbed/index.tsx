/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./spotimbed.css";

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import type { Embed, Message } from "discord-types/general";

import { createSpotimbed, Spotimbed } from "./components/Embed";
import { settings } from "./settings";
import { createEmbedData, getEmbeddableLinks } from "./utils/ast";

export default definePlugin({
    name: "SpotiMbed",
    description: "Makes Spotify embeds reliable and actually useable",
    authors: [Devs.Vap],
    patches: [
        {
            find: "renderEmbeds(){",
            replacement: {
                // .renderEmbeds = function(message) { ... }
                match: /\.renderEmbeds=function\((\i)\)\{/,
                // .renderEmbeds = function(message) { message = patchedMessage }
                replace: "$&$1=$self.patchMessage($1);",
            }
        },
        {
            find: '.provider&&"Spotify"===',
            replacement: {
                // "Spotify" === embed.provider.name ? <DiscordEmbed embed={embed} /> : ...
                match: /(?<="Spotify"===\i\.provider\.name\?\(0,\i\.jsx\)\()\i(?=,)/,
                // "Spotify" === embed.provider.name ? <SpotiMbed embed={embed} /> : ...
                replace: "$self.createSpotimbed",
            },
        },
        {
            find: ".PLAYER_DEVICES",
            replacement: {
                // get: request.bind(null, methods.get)
                match: /(?=get:(\i)\.bind\(null,(\i(?:\.\i)?)\.get\))/,
                // post: request.bind(null, methods.post), get: ...
                replace: "post:$1.bind(null,$2.post),",
            },
        },
        {
            find: "getActiveSocketAndDevice(){",
            replacement: {
                // store.hasConnectedAccount = function() { return Object.keys(accounts) ...
                match: /(?=hasConnectedAccount\(\)\{return Object\.keys\((\i)\))/,
                // store.getConnectedAccounts = function() { return accounts }; store.hasConnectedAccount = ...
                replace: "getConnectedAccounts(){return $1}",
            },
        }
    ],
    settings,

    // exports
    createSpotimbed,
    Spotimbed,
    patchMessage: (message: Message): Message => {
        const embeds = message.embeds.filter(e => e.provider?.name !== "Spotify");

        const links = getEmbeddableLinks(message.content, "open.spotify.com");
        embeds.push(...links.map(link => createEmbedData(link) as Embed));

        return new Proxy(message, {
            get(target, prop) {
                if (prop === "embeds") return embeds;
                return Reflect.get(target, prop);
            }
        });
    },
});
