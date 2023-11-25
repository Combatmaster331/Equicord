/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "Equicordo",
    description: "Replaces the discordo sound on startup with something a bit more interesting. Sound by FoxStorm1.",
    authors: [Devs.echo, Devs.thororen, Devs.FoxStorm1],
    patches: [
        {
            find: "44208515805198d4c548.mp3",
            replacement: {
                match: /e\.exports=n\.p\+"[a-zA-Z0-9]+\.mp3"/,
                replace: 'e.exports="https://github.com/Equicord/Ignore/raw/main/equicordo.mp3"'
            }
        },
    ],
});
