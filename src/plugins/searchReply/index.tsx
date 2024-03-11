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

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { ReplyIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, i18n, Menu, PermissionsBits, PermissionStore, SelectedChannelStore } from "@webpack/common";
import { Message } from "discord-types/general";


const messageUtils = findByPropsLazy("replyToMessage");

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, { message }: { message: Message; }) => {
    // make sure the message is in the selected channel
    if (SelectedChannelStore.getChannelId() !== message.channel_id) return;
    const channel = ChannelStore.getChannel(message?.channel_id);
    if (!channel) return;
    if (channel.guild_id && !PermissionStore.can(PermissionsBits.SEND_MESSAGES, channel)) return;

    // dms and group chats
    const dmGroup = findGroupChildrenByChildId("pin", children);
    if (dmGroup && !dmGroup.some(child => child?.props?.id === "reply")) {
        const pinIndex = dmGroup.findIndex(c => c?.props.id === "pin");
        dmGroup.splice(pinIndex + 1, 0, (
            <Menu.MenuItem
                id="reply"
                label={i18n.Messages.MESSAGE_ACTION_REPLY}
                icon={ReplyIcon}
                action={(e: React.MouseEvent) => messageUtils.replyToMessage(channel, message, e)}
            />
        ));
        return;
    }

    // servers
    const serverGroup = findGroupChildrenByChildId("mark-unread", children);
    if (serverGroup && !serverGroup.some(child => child?.props?.id === "reply")) {
        serverGroup.unshift((
            <Menu.MenuItem
                id="reply"
                label={i18n.Messages.MESSAGE_ACTION_REPLY}
                icon={ReplyIcon}
                action={(e: React.MouseEvent) => messageUtils.replyToMessage(channel, message, e)}
            />
        ));
        return;
    }
};


export default definePlugin({
    name: "SearchReply",
    description: "Adds a reply button to search results",
    authors: [Devs.Aria],
    contextMenus: {
        "message": messageContextMenuPatch
    }
});
