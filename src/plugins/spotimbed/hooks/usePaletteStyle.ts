/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useMemo } from "@webpack/common";

import { settings } from "../settings";
import { getRgbContrast, hslTargets, hsv2rgb, pickColor } from "../utils/color";
import { RgbPalette } from "../utils/image";
import { lerpList } from "../utils/misc";

export function usePaletteStyle(palette: RgbPalette | null) {
    const { colorStyle, forceStyle } = settings.use(["colorStyle", "forceStyle"]);

    return useMemo(() => {
        let accent = "var(--background-secondary)";
        let theme: `theme-${"custom" | "dark" | "light"}` = "theme-custom";

        if (colorStyle !== "discord" && palette) {
            const colorHsl = pickColor(colorStyle, palette);
            if (forceStyle) {
                const lerped = lerpList(colorHsl, hslTargets[colorStyle], forceStyle / 100);
                for (let i = 0; i < 3; i++) colorHsl[i] = isNaN(lerped[i]) ? colorHsl[i] : lerped[i];
            }
            const [r, g, b] = hsv2rgb(colorHsl);
            const contrast = getRgbContrast([r, g, b]);
            accent = `rgb(${r}, ${g}, ${b})`;
            theme = `theme-${contrast}`;
        }

        return [accent, theme] as const;
    }, [JSON.stringify(palette), colorStyle, forceStyle]);
}
