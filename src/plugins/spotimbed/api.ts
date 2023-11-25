/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByPropsLazy } from "@webpack";
import axios from "axios";

import { Album, Artist, MarketQuery, Pagination, PatchedSpotifyStore, Playlist, RepeatState, Resource, SpotifyHttp, Track, User } from "./types";

const API_BASE = "https://api.spotify.com/v1";

const spotifyStore: PatchedSpotifyStore = findByPropsLazy("getActiveSocketAndDevice");

const resourcePromiseCache = new Map<string, Promise<any>>();

type SearchableResource = Track | Album | Playlist | Artist;
type ResourceMap = { [K in Resource["type"]]: Extract<Resource, { type: K; }>; };
type Query = Record<string, any>;

function makePath(pathname: string, query?: Query) {
    return query ? `${pathname}?${new URLSearchParams(query)}` : pathname;
}

export const Spotify = {
    http(method: keyof SpotifyHttp, path: string) {
        const socket = Object.values(spotifyStore.getConnectedAccounts())[0];
        if (!socket) return Promise.reject(new Error("No Spotify account connected"));

        return axios({
            method: method,
            url: API_BASE + path,
            headers: {
                "Authorization": "Bearer " + socket.accessToken
            }
        }).then(res => res.data);
    },
    get(pathname: string, query?: Query) {
        const path = makePath(pathname, query);

        const cachedResourcePromise = resourcePromiseCache.get(path);
        if (cachedResourcePromise) return cachedResourcePromise;

        const resourcePromise = this.http("get", path).finally(() => {
            resourcePromiseCache.delete(path);
        });

        resourcePromiseCache.set(path, resourcePromise);
        return resourcePromise;
    },
    put(pathname: string, query?: Query) {
        return this.http("put", makePath(pathname, query));
    },
    post(pathname: string, query?: Query) {
        return this.http("post", makePath(pathname, query));
    },

    // TODO use _.pick to lessen memory footprint
    getTrack(trackId: string, query?: Partial<MarketQuery>): Promise<Track> {
        return this.get(`/tracks/${trackId}`, query);
    },
    getAlbum(albumId: string, query?: Partial<MarketQuery>): Promise<Album> {
        return this.get(`/albums/${albumId}`, query);
    },
    getPlaylist(playlistId: string, query?: Partial<MarketQuery>): Promise<Playlist> {
        return this.get(`/playlists/${playlistId}`, query);
    },
    getArtist(artistId: string): Promise<Artist> {
        return this.get(`/artists/${artistId}`);
    },
    getArtistTopTracks(artistId: string, query: Partial<MarketQuery>): Promise<{ tracks: Track[]; }> {
        return this.get(`/artists/${artistId}/top-tracks`, query);
    },
    getUser(userId: string): Promise<User> {
        return this.get(`/users/${userId}`);
    },
    getSearch<TK extends SearchableResource["type"]>(query: string, types: TK[], opts?: Partial<MarketQuery & {
        limit: number;
        offset: number;
    }>): Promise<{
        [K in TK]: Pagination<ResourceMap[K]>;
    }> {
        return this.get("/search", {
            q: query,
            type: types.join(","),
            ...opts,
        });
    },

    prev() {
        return this.post("/me/player/previous");
    },
    next() {
        return this.post("/me/player/next");
    },
    setVolume(percent: number) {
        return this.put("/me/player/volume", { volume_percent: Math.round(percent) });
    },
    setPlaying(playing: boolean) {
        return this.put(`/me/player${playing ? "/play" : "/pause"}`);
    },
    setRepeat(state: RepeatState) {
        return this.put("/me/player/repeat", { state });
    },
    setShuffle(state: boolean) {
        return this.put("/me/player/shuffle", { state });
    },
    seek(ms: number) {
        return this.put("/me/player/seek", { position_ms: Math.round(ms) });
    },
    queue(track: Track | Track["id"]) {
        const trackId = typeof track === "string" ? track : track.id;
        return this.post("/me/player/queue", { uri: `spotify:track:${trackId}` });
    },
};
