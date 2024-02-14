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

import "./style.css";

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Timestamp } from "@webpack/common";
import { Message } from "discord-types/general";
import { HTMLAttributes } from "react";

const MessageIds = findByPropsLazy("getMessageTimestampId");
const DateUtils = findByPropsLazy("calendarFormat", "dateFormat", "isSameDay", "accessibilityLabelCalendarFormat");
const MessageClasses = findByPropsLazy("separator", "latin24CompactTimeStamp");

function Sep(props: HTMLAttributes<HTMLElement>) {
    return <i className={MessageClasses.separator} aria-hidden={true} {...props} />;
}

export default definePlugin({
    name: "ReplyTimestamp",
    description: "Shows a timestamp on replied-message previews",
    authors: [Devs.Kyuu],

    patches: [
        {
            find: ",{renderSingleLineMessage:function(){return ",
            replacement: {
                match: /(?<="aria-label":\w+,children:\[)(?=\w+,\w+,\w+\])/,
                replace: "$self.ReplyTimestamp(arguments[0]),"
            }
        }
    ],

    ReplyTimestamp({
        referencedMessage,
        baseMessage,
    }: {
        referencedMessage: { state: number, message?: Message; },
        baseMessage: Message;
    }) {
        if (referencedMessage.state === 0) {
            const refTimestamp = referencedMessage.message!.timestamp;
            const baseTimestamp = baseMessage.timestamp;
            return <Timestamp
                id={MessageIds.getMessageTimestampId(referencedMessage.message)}
                className="c98-reply-timestamp"
                compact={DateUtils.isSameDay(refTimestamp, baseTimestamp)}
                timestamp={refTimestamp}
                isInline={false}
            >
                <Sep>[</Sep>
                {DateUtils.isSameDay(refTimestamp, baseTimestamp)
                    ? DateUtils.dateFormat(refTimestamp, "LT")
                    : DateUtils.calendarFormat(refTimestamp)
                }
                <Sep>]</Sep>
            </Timestamp>;
        }
    },
});
