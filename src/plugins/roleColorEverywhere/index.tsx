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

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelStore, GuildMemberStore, GuildStore } from "@webpack/common";

const settings = definePluginSettings({
    chatMentions: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Show role colors in chat mentions (including in the message box)",
        restartNeeded: true
    },
    memberList: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Show role colors in member list role headers",
        restartNeeded: true
    },
    voiceUsers: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Show role colors in the voice chat user list",
        restartNeeded: true
    }
});

export default definePlugin({
    name: "RoleColorEverywhere",
    authors: [Devs.KingFish, Devs.lewisakura, Devs.AutumnVN],
    description: "Adds the top role color anywhere possible",
    patches: [
        // Chat Mentions
        {
            find: "CLYDE_AI_MENTION_COLOR:null,",
            replacement: [
                {
                    match: /user:(\i),channel:(\i).{0,400}?"@"\.concat\(.+?\)/,
                    replace: "$&,color:$self.getUserColor($1?.id,{channelId:$2?.id})"
                }
            ],
            predicate: () => settings.store.chatMentions,
        },
        // Slate
        {
            find: ".userTooltip,children",
            replacement: [
                {
                    match: /let\{id:(\i),guildId:(\i)[^}]*\}.*?\.default,{(?=children)/,
                    replace: "$&color:$self.getUserColor($1,{guildId:$2}),"
                }
            ],
            predicate: () => settings.store.chatMentions,
        },
        {
            find: 'tutorialId:"whos-online',
            replacement: [
                {
                    match: /null,\i," — ",\i\]/,
                    replace: "null,$self.roleGroupColor(arguments[0])]"
                },
            ],
            predicate: () => settings.store.memberList,
        },
        {
            find: ".Messages.THREAD_BROWSER_PRIVATE",
            replacement: [
                {
                    match: /children:\[\i," — ",\i\]/,
                    replace: "children:[$self.roleGroupColor(arguments[0])]"
                },
            ],
            predicate: () => settings.store.memberList,
        },
        {
            find: "renderPrioritySpeaker",
            replacement: [
                {
                    match: /renderName\(\).{0,100}speaking:.{50,100}jsx.{5,10}{/,
                    replace: "$&...$self.getVoiceProps(this.props),"
                }
            ],
            predicate: () => settings.store.voiceUsers,
        }
    ],
    settings,

    getColor(userId: string, { channelId, guildId }: { channelId?: string; guildId?: string; }) {
        if (!(guildId ??= ChannelStore.getChannel(channelId!)?.guild_id)) return null;
        return GuildMemberStore.getMember(guildId, userId)?.colorString ?? null;
    },

    getUserColor(userId: string, ids: { channelId?: string; guildId?: string; }) {
        const colorString = this.getColor(userId, ids);
        return colorString && parseInt(colorString.slice(1), 16);
    },

    roleGroupColor({ id, count, title, guildId, label }: { id: string; count: number; title: string; guildId: string; label: string; }) {
        const guild = GuildStore.getGuild(guildId);
        const role = guild?.roles[id];

        return (
            <span style={{
                color: role?.colorString,
                fontWeight: "unset",
                letterSpacing: ".05em"
            }}>
                {title ?? label} &mdash; {count}
            </span>
        );
    },

    getVoiceProps({ user: { id: userId }, guildId }: { user: { id: string; }; guildId: string; }) {
        return {
            style: {
                color: this.getColor(userId, { guildId })
            }
        };
    }
});
