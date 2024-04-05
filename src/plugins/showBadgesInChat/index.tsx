/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addDecoration, removeDecoration } from "@api/MessageDecorations";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { isPluginDev } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";
import { findByProps } from "@webpack";
import { React } from "@webpack/common";

import BadgeApi from "../../plugins/_api/badges";
import { BadgeCache } from "./types";

let RoleIconComponent: React.ComponentType<any> = () => null;
let roleIconClassName = "";

const discordBadges: readonly [number, string, string][] = Object.freeze([
    [0, "Discord Staff", "5e74e9b61934fc1f67c65515d1f7e60d"],
    [1, "Partnered Server Owner", "3f9748e53446a137a052f3454e2de41e"],
    [2, "HypeSquad Events", "bf01d1073931f921909045f3a39fd264"],
    [6, "HypeSquad Bravery", "8a88d63823d8a71cd5e390baa45efa02"],
    [7, "HypeSquad Brilliance", "011940fd013da3f7fb926e4a1cd2e618"],
    [8, "HypeSquad Balance", "3aa41de486fa12454c3761e8e223442e"],
    [3, "Discord Bug Hunter", "2717692c7dca7289b35297368a940dd0"],
    [14, "Discord Bug Hunter", "848f79194d4be5ff5f81505cbd0ce1e6"],
    [22, "Active Developer", "6bdc42827a38498929a4920da12695d9"],
    [17, "Early Verified Bot Developer", "6df5892e0f35b051f8b61eace34f4967"],
    [9, "Early Supporter", "7060786766c9c840eb3019e725d2b358"],
    [18, "Moderator Programs Alumni", "fee1624003e2fee35cb398e125dc479b"]
]);

const API_URL = "https://clientmodbadges-api.herokuapp.com/";
const cache = new Map<string, BadgeCache>();
const EXPIRES = 1000 * 60 * 15;

const fetchBadges = (id: string): BadgeCache["badges"] | undefined => {
    const cachedValue = cache.get(id);
    if (!cache.has(id) || (cachedValue && cachedValue.expires < Date.now())) {
        fetch(`${API_URL}users/${id}`)
            .then(res => res.json() as Promise<BadgeCache["badges"]>)
            .then(body => {
                cache.set(id, { badges: body, expires: Date.now() + EXPIRES });
                return body;
            });
    } else if (cachedValue) {
        return cachedValue.badges;
    }
};

const GlobalBadges = (userID: string) => {
    const [badges, setBadges] = React.useState<BadgeCache["badges"]>({});
    React.useEffect(() => setBadges(fetchBadges(userID) ?? {}), [userID]);
    const globalBadges: JSX.Element[] = [];

    Object.keys(badges).forEach(mod => {
        if (mod.toLowerCase() === "vencord") return;
        badges[mod].forEach(badge => {
            if (typeof badge === "string") {
                badge = {
                    name: badge,
                    badge: `${API_URL}badges/${mod}/${(badge as string).replace(mod, "").trim().split(" ")[0]}`
                };
            } else if (typeof badge === "object") badge.custom = true;
            const cleanName = badge.name.replace(mod, "").trim();
            if (!badge.custom) badge.name = `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`;
            globalBadges.push(<RoleIconComponent className={roleIconClassName} name={badge.name} size={20} src={badge.badge} />);
        });
    });

    return [
        <span style={{ order: settings.store.globalBadgesPosition }}>
            {globalBadges}
        </span>
    ];
};

function vencordDonorChatBadges(userID: string) {
    return [
        <span style={{ order: settings.store.vencordDonorBadgesPosition }}>
            {BadgeApi.getDonorBadges(userID)?.map(badge =>
                <RoleIconComponent
                    className={roleIconClassName}
                    name={badge.description}
                    size={20}
                    src={badge.image}
                />
            )}
        </span>
    ];
}

function vencordEquicordContributorChatBadge(userID: string) {
    return isPluginDev(userID) ? [
        <span style={{ order: settings.store.vencordEquicordContributorBadgePosition }}>
            <RoleIconComponent
                className={roleIconClassName}
                name={"Vencord/Equicord Contributor"}
                size={20}
                src={"https://i.ibb.co/RHqhhVG/Untitled-design-83-removebg-preview.png"}
            />
        </span>
    ] : [];
}

function discordProfileChatBadges(userFlags: number) {
    const chatBadges = discordBadges.reduce((badges: JSX.Element[], curr) => {
        if ((userFlags & 1 << curr[0]) !== 0)
            badges.push(
                <RoleIconComponent
                    className={roleIconClassName}
                    name={curr[1]}
                    size={20}
                    src={`https://cdn.discordapp.com/badge-icons/${curr[2]}.png`}
                />
            );
        return badges;
    }, []);

    return chatBadges.length > 0 ? [
        <span style={{ order: settings.store.discordProfileBadgesPosition }}>
            {chatBadges}
        </span>
    ] : [];
}

function discordNitroChatBadge(userPremiumType: number) {
    return userPremiumType > 0 ? [
        <span style={{ order: settings.store.discordNitroBadgePosition }}>
            <RoleIconComponent
                className={roleIconClassName}
                name={"Discord Nitro" + (userPremiumType === 3 ? " Basic" : userPremiumType === 1 ? " Classic" : "")}
                size={20}
                src={"https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png"}
            />
        </span>
    ] : [];
}

function ChatBadges({ author }) {
    const chatBadges = [
        ...settings.store.showGlobalBadges ? GlobalBadges(author.id) : [],
        ...settings.store.showVencordDonorBadges ? vencordDonorChatBadges(author.id) : [],
        ...settings.store.showVencordEquicordContributorBadges ? vencordEquicordContributorChatBadge(author.id) : [],
        ...settings.store.showDiscordProfileBadges ? discordProfileChatBadges(author.flags || author.publicFlags) : [],
        ...settings.store.showDiscordNitroBadges ? discordNitroChatBadge(author.premiumType) : []
    ];

    return chatBadges.length > 0 ?
        <span style={{ display: "inline-flex", verticalAlign: "top" }}>
            {chatBadges}
        </span>
        : null;
}

const settings = definePluginSettings({
    showVencordDonorBadges: {
        type: OptionType.BOOLEAN,
        description: "Enable to show Equicord donor badges in chat.",
        default: true
    },
    vencordDonorBadgesPosition: {
        type: OptionType.NUMBER,
        description: "The position of the Equicord Donor badges.",
        default: 0
    },
    showVencordEquicordContributorBadges: {
        type: OptionType.BOOLEAN,
        description: "Enable to show Vencord/Equicord contributor badges in chat.",
        default: true
    },
    vencordEquicordContributorBadgePosition: {
        type: OptionType.NUMBER,
        description: "The position of the Vencord/Equicord Contributor badge.",
        default: 1
    },
    showGlobalBadges: {
        type: OptionType.BOOLEAN,
        description: "Enable to show Global Badges in chat. A bit buggy so switch channels for it to load.",
        default: true
    },
    globalBadgesPosition: {
        type: OptionType.NUMBER,
        description: "The position of the Discord Nitro badge.",
        default: 2
    },
    showDiscordNitroBadges: {
        type: OptionType.BOOLEAN,
        description: "Enable to show Discord Nitro badges in chat.",
        default: true
    },
    discordProfileBadgesPosition: {
        type: OptionType.NUMBER,
        description: "The position of the Discord profile badges.",
        default: 3
    },
    showDiscordProfileBadges: {
        type: OptionType.BOOLEAN,
        description: "Enable to show Discord Nitro badges in chat.",
        default: true
    },
    discordNitroBadgePosition: {
        type: OptionType.NUMBER,
        description: "The position of the Discord Nitro badge.",
        default: 4
    }
});

export default definePlugin({
    name: "ShowBadgesInChat",
    authors: [Devs.Shalev, Devs.fres, Devs.ryan, Devs.KrystalSkull],
    description: "Shows profile badges in chat. That includes built in Discord Badges. Also shows Vencord Contributor Badges and all Donor badges.",
    dependencies: ["MessageDecorationsAPI"],
    patches: [
        {
            find: "Messages.ROLE_ICON_ALT_TEXT",
            replacement: {
                match: /function \i\(\i\){let \i,{className:.*?\)}\)}/,
                replace: "$self.RoleIconComponent=$&;$&",
            }
        }
    ],
    settings,
    set RoleIconComponent(c: any) {
        RoleIconComponent = c;
    },
    start: () => {
        roleIconClassName = findByProps("roleIcon", "separator").roleIcon;
        addDecoration("vc-show-badges-in-chat", props => <ChatBadges author={props.message?.author} />);
    },
    stop: () => {
        removeDecoration("vc-show-badges-in-chat");
    }
});
