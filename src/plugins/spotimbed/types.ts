/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type DisplayResource = Track | Album | Playlist | ArtistWithTracks | User;


// Discord Spotify Types

export interface SpotifySocket {
    accountId: string;
    accessToken: string;
    connectionId: string;
    isPremium: boolean;
    socket: WebSocket;
}

export interface PlayerTrack {
    id: string;
    name: string;
    duration: number;
    isLocal: boolean;
    album: {
        id: string;
        name: string;
        image: {
            height: number;
            width: number;
            url: string;
        };
    };
    artists: {
        id: string;
        href: string;
        name: string;
        type: string;
        uri: string;
    }[];
}

export type RepeatState = "off" | "track" | "context";

export interface PatchedSpotifyStore {
    getConnectedAccounts(): Partial<Record<string, SpotifySocket>>;
}

export type SpotifyHttp = Record<"get" | "put" | "post", (accountId: string, accessToken: string, options: { url: string; }) => Promise<any>>;

// Spotify API Types

export const enum RestrictionReason {
    Market = "market",
    Product = "product",
    Explicit = "explicit",
}

interface ApiResource {
    type: string;
    id: string;
    name: string;
    external_urls: { spotify: string; };
    href: string;
    uri: string;
}
export interface Pagination<T> {
    href: string;
    items: T[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
}
export interface ResourceImage {
    height: number;
    width: number;
    url: string;
}
type Followers = { total: number; };

export enum ResourceType {
    Track = "track",
    Album = "album",
    Playlist = "playlist",
    Artist = "artist",
    User = "user",
}
export interface Track extends ApiResource {
    type: ResourceType.Track;

    album: Album<false>;
    artists: Artist[];

    restrictions?: { reason: string; };
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    is_local: boolean;
    preview_url: string | null;
    track_number: number;
    popularity: number;
    available_markets: string[];
}
export interface Album<HasTracks = true> extends ApiResource {
    type: ResourceType.Album;

    artists: Artist[];
    tracks: HasTracks extends true ? Pagination<Track> : never;

    images: ResourceImage[];
    album_type: "album" | "single" | "compilation";
    genres: string[];
    restrictions?: { reason: string; };
    release_date: string;
    release_date_precision: "year" | "month" | "day";
    label: string;
    popularity: number;
    available_markets: string[];
}
export interface PlaylistItem {
    added_at: string;
    added_by: PartialUser;
    is_local: boolean;
    track: Track | null;
}
export interface Playlist extends ApiResource {
    type: ResourceType.Playlist;

    owner: User;
    tracks: Pagination<PlaylistItem>;

    images: ResourceImage[];
    followers: Followers;
    description: string;
    collaborative: boolean;
    public: boolean;
    snapshot_id: string;
}
export interface Artist extends ApiResource {
    type: ResourceType.Artist;

    images: ResourceImage[];
    followers: Followers;
    genres: string[];
    popularity: number;
}
export interface ArtistWithTracks extends Artist {
    tracks: Track[];
}
export interface PartialUser extends ApiResource {
    type: ResourceType.User;
}
export interface User extends PartialUser {
    images: ResourceImage[];
    followers: Followers;
    display_name: string;
}
export interface TopTracks {
    tracks: Track[];
}

// Resource Types

export type Resource = Track | Album | Playlist | Artist | User;

// Query Types

export type MarketQuery = { market: string; };
