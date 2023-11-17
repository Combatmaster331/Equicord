/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { proxyLazy } from "@utils/lazy";
import { find } from "@webpack";
import { React, useEffect, useRef } from "@webpack/common";
import { Constructor } from "type-fest";

import { usePlayer } from "../hooks/usePlayer";
import { settings } from "../settings";
import { DisplayResource } from "../types";
import { cl } from "../utils/misc";
import { getSelectedTrack } from "../utils/spotify";
import { QueueButton } from "./buttons/QueueButton";

interface MediaPlayerProps {
    src: string;
    type: "AUDIO" | "VIDEO";
    height?: number | "100%" | "auto";
    width?: number | "100%" | "auto";
    forceExternal: boolean;
    autoPlay: boolean;
    playable: boolean;
    fileName: string;
    fileSize: string;
    renderLinkComponent: () => React.ReactElement;
    volume: () => number;
    onMute: (muted: boolean) => void;
    onVolumeChange: (volume: number) => void;
    autoMute: () => void;
    onPlay?: () => void;
}
interface MediaPlayerState {
    playing: boolean;
}
interface MediaPlayer extends React.PureComponent<MediaPlayerProps, MediaPlayerState> {
    setPlay(play: boolean): void;
}

const MediaPlayer = proxyLazy(() => {
    const DiscordMediaPlayer: Constructor<MediaPlayer> = find(m => m.prototype?.renderControls);
    return class MediaPlayer extends DiscordMediaPlayer {
        render() {
            return React.cloneElement(super.render() as React.ReactElement, { className: cl("media-player") });
        }
        componentDidUpdate(prevProps: MediaPlayerProps, prevState: MediaPlayerState, snapshot) {
            super.componentDidUpdate?.(prevProps, prevState, snapshot);
            if (!prevState.playing && this.state.playing) this.props.onPlay?.();
        }
    };
});

export interface AudioControlsProps {
    resource?: DisplayResource | null;
    trackIndex?: number;
    mediaHref?: string | null;
}

export const AudioControls = ({ mediaHref, resource, trackIndex }: AudioControlsProps) => {
    const { volume } = settings.use(["volume"]);
    const [playing, play] = usePlayer();
    const playerRef = useRef<MediaPlayer>(null);

    if (playerRef.current?.state.playing && !playing) playerRef.current.setPlay(false);

    const firstRender = useRef(true);
    useEffect(() => {
        if (!firstRender.current) playerRef.current?.setPlay(true);
        else firstRender.current = false;
    }, [trackIndex]);

    const mediaPlayer = mediaHref ? (
        <MediaPlayer
            ref={playerRef as any}
            key={mediaHref}
            src={mediaHref}
            type="AUDIO"
            width={"auto"}
            forceExternal={false}
            autoPlay={false}
            playable={true}
            fileName=""
            fileSize=""
            renderLinkComponent={() => <></>}
            volume={() => volume}
            onMute={() => { }}
            onVolumeChange={volume => settings.store.volume = volume}
            autoMute={() => { }}
            onPlay={() => play()}
        />
    ) : (
        <div className={cl("placeholder-wrap", "blinking")}>
            <div className={cl("placeholder", "placeholder-btn")} />
            <div className={cl("placeholder")} style={{ width: "66px" }} />
            <div className={cl("placeholder", "placeholder-scrubber")} />
            <div className={cl("placeholder", "placeholder-btn")} />
        </div>
    );

    const selectedTrack = resource && trackIndex != null && getSelectedTrack(resource, trackIndex);

    return <div className={cl("controls")}>
        {mediaPlayer}
        {selectedTrack && <QueueButton tooltip="Add to queue" track={selectedTrack} />}
    </div>;
};
