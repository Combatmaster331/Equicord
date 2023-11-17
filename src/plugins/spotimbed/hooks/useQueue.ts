/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useState } from "@webpack/common";

import { Spotify } from "../api";
import { useAwaiter } from "./useAwaiter";

export function useQueue(cooldown: number) {
    const [trackId, setTrackId] = useState<string | null>(null);

    const [completed, error, pending] = useAwaiter(async () => {
        if (!trackId) return false;
        await Spotify.queue(trackId);
        setTimeout(() => setTrackId(null), cooldown);
        return true;
    }, {
        fallbackValue: false,
        deps: [trackId],
    });

    return [completed, pending, error, setTrackId] as const;
}
