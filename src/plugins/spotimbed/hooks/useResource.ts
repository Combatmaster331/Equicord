/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Spotify } from "../api";
import { logger } from "../logger";
import { settings } from "../settings";
import { Album, ArtistWithTracks, DisplayResource, ResourceType, RestrictionReason, Track } from "../types";
import { useCachedAwaiter } from "./useCachedAwaiter";

async function followMarket<T extends Album | Track>(
    getter: (market: string) => Promise<T>,
    market: string,
): Promise<T> {
    let resource = await getter(market);
    if (resource.restrictions?.reason === RestrictionReason.Market && resource.available_markets.length > 0)
        resource = await getter(resource.available_markets[0]);
    return resource;
}

export async function getResource(id: string, type: string): Promise<DisplayResource | null> {
    switch (type) {
        case ResourceType.Track: {
            return followMarket(market => Spotify.getTrack(id, { market }), settings.store.market);
        }
        case ResourceType.Album: {
            return followMarket(market => Spotify.getAlbum(id, { market }), settings.store.market);
        }
        case ResourceType.Playlist: {
            return Spotify.getPlaylist(id, { market: settings.store.market });
        }
        case ResourceType.Artist: {
            const artist = await Spotify.getArtist(id) as ArtistWithTracks;
            artist.tracks ??= (await Spotify.getArtistTopTracks(id, { market: settings.store.market })).tracks;
            return artist;
        }
        case ResourceType.User: {
            return Spotify.getUser(id);
        }
    }
    return null;
}

export function useResource(id: string, type: string, noop = false) {
    const [resource, error] = useCachedAwaiter(async () => {
        if (noop) return null;
        return getResource(id, type);
    }, {
        deps: [type, id, noop],
        storeKey: "spotimbed:resource",
    });

    if (error instanceof Error) throw error;
    else if (error) logger.error(error);

    return resource;
}
