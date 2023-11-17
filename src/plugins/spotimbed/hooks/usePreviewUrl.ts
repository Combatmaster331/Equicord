/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useRef, useState } from "@webpack/common";

import { DisplayResource } from "../types";
import { getSelectedTrack } from "../utils/spotify";


export function usePreviewUrl(resource: DisplayResource | null) {
    const idRef = useRef(resource?.id);
    const [trackIndex, setTrackIndex] = useState(0);

    if (resource?.id && idRef.current !== resource.id) {
        idRef.current = resource.id;
        setTrackIndex(0);
    }

    const previewUrl = resource && getSelectedTrack(resource, trackIndex)?.preview_url;

    return [previewUrl, trackIndex, setTrackIndex] as const;
}
