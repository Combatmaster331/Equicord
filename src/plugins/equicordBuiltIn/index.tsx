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

// Import required modules and components
import { disableStyle, enableStyle } from "@api/Styles";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

// Importing the style managed fixes on and off switch
import betterauthapps from "./css/betterauthapps.css?managed";
import betterstatuspicker from "./css/betterstatuspicker.css?managed";
import consistentchatbar from "./css/consistentchatbar.css?managed";
import equicord from "./css/equicord.css?managed";
import graidentbuttons from "./css/graidentbuttons.css?managed";
import nitrothemesfix from "./css/nitrothemesfix.css?managed";
import settingsicons from "./css/settingsicons.css?managed";
import user from "./css/userreimagined.css?managed";

// Define the Vencord plugin
export default definePlugin({
    name: "EquicordBuiltIn",
    description: "Built-in CSS for Equicord users",
    authors: [Devs.FoxStorm1, Devs.thororen],
    dependencies: ["ThemeAttributes"],

    start() {
        enableStyle(betterauthapps);
        enableStyle(betterstatuspicker);
        enableStyle(consistentchatbar);
        enableStyle(equicord);
        enableStyle(graidentbuttons);
        enableStyle(nitrothemesfix);
        enableStyle(settingsicons);
        enableStyle(user);
    },
    stop() {
        disableStyle(betterauthapps);
        disableStyle(betterstatuspicker);
        disableStyle(consistentchatbar);
        disableStyle(equicord);
        disableStyle(graidentbuttons);
        disableStyle(nitrothemesfix);
        disableStyle(settingsicons);
        disableStyle(user);
    }
});
