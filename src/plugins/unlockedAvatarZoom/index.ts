/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { makeRange } from "@components/PluginSettings/components";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    zoomMultiplier: {
        type: OptionType.SLIDER,
        description: "Zoom multiplier",
        markers: makeRange(2, 16),
        default: 2,
    },
});

export default definePlugin({
    name: "UnlockedAvatarZoom",
    description: "Unlocks the avatar zoom slider on the edit avatar modal",
    authors: [Devs.nakoyasha],
    settings,
    patches: [
        {
            find: ".Messages.AVATAR_UPLOAD_EDIT_MEDIA",
            replacement: {
                match: /(maxValue:(\w))/,
                replace: "maxValue:$self.settings.store.zoomMultiplier",
            }
        }
    ]
});
