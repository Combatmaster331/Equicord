/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByPropsLazy } from "@webpack";
import type { React } from "@webpack/common";

import { DisplayResource, ResourceType, Track } from "../types";
import { cl } from "../utils/misc";
import { getTracks } from "../utils/spotify";
import { formatDuration } from "../utils/time";
import { Byline, ResourceLink } from "./common";

const listResourceTypes = [ResourceType.Album, ResourceType.Playlist, ResourceType.Artist];
const scrollerClasses: Record<string, string> = findByPropsLazy("thin");

export interface TrackListProps {
    resource: DisplayResource | null;
    resourceType: ResourceType;
    selectedTrack: number;
    onTrackSelect(track: number): void;
}
export function TrackList({
    resource,
    resourceType,
    selectedTrack,
    onTrackSelect: selectTrack
}: TrackListProps) {
    const Container = (children: React.ReactNode) => (
        <div className={`${cl("content", "tracklist")} ${scrollerClasses.thin}`}>
            {children}
        </div>
    );

    if (!listResourceTypes.includes(resourceType)) return null;
    if (!resource) return Container(null);

    const tracks = getTracks(resource);
    if (!tracks) return Container(null);

    const rows = tracks.map((track, i) => (
        <TrackRow
            key={track.id}
            isSelected={selectedTrack === i}
            track={track}
            position={i + 1}
            onClick={() => selectTrack(i)}
        />
    ));

    return Container(rows);
}

interface TrackRowProps {
    track: Track;
    position: number;
    isSelected: boolean;
    onClick(): void;
}
function TrackRow({ track, position, isSelected, onClick }: TrackRowProps) {
    const isDisabled = !track.preview_url;
    return (
        <div
            className={cl(
                "trackrow",
                isDisabled ? "disabled" : [],
                !isDisabled && isSelected ? "active" : [],
            )}
            onClick={isDisabled ? void 0 : onClick}
        >
            <div className={cl("trackrow-index", "mono")}>{position}</div>
            <div className={cl("trackrow-info")}>
                <ResourceLink resource={track} className={cl("trackrow-title")} />
                <div className={cl("trackrow-infoline")}>
                    <Byline people={track.artists} />
                </div>
            </div>
            <div className={cl("trackrow-length", "mono")}>{formatDuration(track.duration_ms)}</div>
        </div>
    );
}
