/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Vendicated and contributors
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
import definePlugin from "@utils/types";
import { UserStore } from "@webpack/common";
import { User } from "discord-types/general";

let user: ModifiedUser | undefined;
let lastUserId: string | undefined;
let uninject: (() => void) | undefined;

interface ModifiedUser extends User {
    _realPremiumType?: number;
}

export default definePlugin({
    name: "NoNitroUpsell",
    description: "Removes ALL of Discord's nitro upsells by tricking the client into thinking you have nitro.",
    authors: [Devs.thororen],

    ready(user: ModifiedUser): void {
        if (!user) return;
        if ("_realPremiumType" in user) return;

        user._realPremiumType = user.premiumType ?? 0;
        user.premiumType = 2;
        lastUserId = user.id;
    },

    start(): void {
        user = UserStore.getCurrentUser();
        if (user) this.ready(user);

        const onChange = (): void => {
            const newUser = UserStore.getCurrentUser();
            if (newUser && newUser.id !== lastUserId) {
                user = newUser;
                this.ready(user);
            }
        };

        UserStore.addChangeListener(onChange);
        uninject = () => UserStore.removeChangeListener(onChange);
    },

    stop(): void {
        uninject?.();
        const user = UserStore.getCurrentUser();
        if (!user) return;
        if (!("_realPremiumType" in user)) return;
        UserStore?.getCurrentUser()?.premiumType;
        delete user._realPremiumType;
    }
});
