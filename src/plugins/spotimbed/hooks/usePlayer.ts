/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useForceUpdater } from "@utils/react";
import { useEffect, useRef } from "@webpack/common";

let player: symbol | null = null;
const dispatchers = new Set<React.DispatchWithoutAction>();

export function usePlayer() {
    const playerRef = useRef(Symbol());

    const update = useForceUpdater();
    useEffect(() => {
        dispatchers.add(update);
        return () => void dispatchers.delete(update);
    }, []);

    const playing = player === playerRef.current;
    const play = () => {
        player = playerRef.current;
        dispatchers.forEach(d => d());
    };

    return [playing, play] as const;
}
