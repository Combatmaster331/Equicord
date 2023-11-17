/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const SECOND = 1e3;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export const formatDuration = (ms: number) => {
    const parts = [Math.floor(ms / SECOND % 60).toString().padStart(2, "0")];
    parts.unshift(Math.floor(ms / MINUTE % 60).toString().padStart(2, "0"));
    if (ms >= HOUR) parts.unshift(Math.floor(ms / HOUR).toString());
    return parts.join(":").replace(/^0+(?=\d)/, "");
};
