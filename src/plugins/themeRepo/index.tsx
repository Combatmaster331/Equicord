/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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

import { DataStore } from "@api/index";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";

import { CorsProxy, themesEndpoint } from "./API";
import { Theme } from "./types";

const themeStoreLogger = new Logger("ThemeStore");
const dataStoreKey = "themeStore-bd-themes-json";


function setIntervalImmediately(func: () => void, interval: number) {
    func();
    return setInterval(func, interval);
}

export { ThemeRepo } from "./components/Repo";

export default definePlugin({
    name: "ThemeRepo",
    authors: [Devs.Arjix],
    description: "ThemeRepo by Arjix",
    initialized: false,
    required: true,
    start() {
        this.initialized = true;

        const THEME_STORE_UPDATE_INTERVAL = 1000 * 60 * 60 * 2; // Every 2 hours

        this.interval = setIntervalImmediately(async () => {
            const bdThemes = await DataStore.get<{ themes: Theme[], timestamp: number; }>(dataStoreKey);
            if (!bdThemes || (bdThemes.timestamp + THEME_STORE_UPDATE_INTERVAL < Date.now())) {
                const data = await fetch(CorsProxy + encodeURIComponent(themesEndpoint)).then(r => r.json()) as Theme[];
                for (const theme of data) {
                    theme.thumbnail_url = `https://${theme.thumbnail_url || "/resources/ui/content_thumbnail.svg"}`;
                    theme.latestSourceUrl = theme.latestSourceUrl || theme.latest_source_url.replace("https://github.com/", "https://raw.githubusercontent.com/").replace(/\/blob\/(.{32,})/i, "/$1");
                }
                await DataStore.set(dataStoreKey, { themes: data, timestamp: Date.now() });

                themeStoreLogger.info("Updated the BD theme index");
            }

        }, THEME_STORE_UPDATE_INTERVAL / 2); // every hour
    },
    stop() {
        this.initialized = false;

        clearInterval(this.interval);
    },
});
