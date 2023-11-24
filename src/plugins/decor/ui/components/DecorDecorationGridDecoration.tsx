/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ContextMenuApi } from "@webpack/common";

import discordifyDecoration from "../../lib/utils/discordifyDecoration";
import { DecorationGridDecoration } from ".";
import DecorationContextMenu from "./DecorationContextMenu";

interface DecorDecorationGridDecorationProps {
    decoration: any;
    isSelected: boolean;
    onSelect: () => void;
    style: any;
}

export default function DecorDecorationGridDecoration(props) {
    const { decoration } = props;
    delete props.decoration;

    return <DecorationGridDecoration
        {...props}
        onContextMenu={e => {
            ContextMenuApi.openContextMenu(e, () => (
                <DecorationContextMenu
                    decoration={decoration}
                />
            ));
        }}
        avatarDecoration={discordifyDecoration(decoration)}
    />;
}
