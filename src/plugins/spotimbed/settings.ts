/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { wordsFromCamel, wordsToTitle } from "@utils/text";
import { OptionType } from "@utils/types";

import { getMarketName, MARKET_CODES } from "./utils/spotify";

export enum ColorStyle {
    Vibrant = "vibrant",
    Pastel = "pastel",
    Muted = "muted",
    Discord = "discord",
}

const colorMethodNames = Object.values(ColorStyle);

export const settings = definePluginSettings({
    volume: {
        description: "Volume",
        type: OptionType.SLIDER,
        markers: [0, 1],
        default: 0.5,
        componentProps: {
            stickToMarkers: false,
            onValueRender: null,
            onMarkerRender: (value: number) => Math.round(value * 100).toString() + "%",
        },
    },
    colorStyle: {
        description: "Color Style",
        type: OptionType.SELECT,
        options: colorMethodNames.map(name => ({
            label: wordsToTitle(wordsFromCamel(name)),
            value: name,
            default: name === "pastel",
        })),
    },
    forceStyle: {
        description: "Force Style",
        type: OptionType.SLIDER,
        markers: [0, 100],
        default: 0.5,
        componentProps: {
            stickToMarkers: false,
            onValueRender: null,
        }
    },
    market: {
        description: "Market",
        type: OptionType.SELECT,
        options: MARKET_CODES.map(code => ({
            label: getMarketName(code) || `??? (${code})`,
            value: code,
            default: code === "US",
        })),
    },
    nativeLinks: {
        description: "Native Links",
        type: OptionType.BOOLEAN,
        default: false,
    },
    numericMonth: {
        description: "Display months as numbers",
        type: OptionType.BOOLEAN,
        default: false,
    }
});
