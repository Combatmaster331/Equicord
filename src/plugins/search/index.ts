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

import { ApplicationCommandOptionType, findOption } from "@api/Commands";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "Search",
    authors: [Devs.JacobTm, Devs.thororen],
    description: "Searchs the web.",
    dependencies: ["CommandsAPI"],
    commands: [{
        name: "search",
        description: "Generates search link.",
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "Search query",
                description: "What do you want to search?",
                required: true
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "Search engine",
                description: "What do you want to search?",
                required: true,
                choices: [
                    { label: "Google", name: "Google", value: "google" },
                    { label: "DDG", name: "DDG", value: "duckduckgo" },
                ]
            }
        ],

        execute(args) {
            const query = args[0].value.replace(" ", "+");
            const engine = findOption<string>(args, "Search engine");
            let link;
            if (engine === "google") {
                link = "https://google.com/search?query=" + query;
            } else if (engine === "duckduckgo") {
                link = "https://duckduckgo.com/" + query;
            }
            return {
                content: link
            };
        }
    }],
});
