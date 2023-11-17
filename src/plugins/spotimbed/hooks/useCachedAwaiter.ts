/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { LinkedList } from "../utils/data";
import { useAwaiter } from "./useAwaiter";

const stores: Record<string, Store> = {};

type Store<T = any> = {
    keys: LinkedList<string>,
    values: Record<string, T>,
};

interface CachedAwaiterOptions {
    deps: (undefined | null | string | number | boolean)[];
    storeKey: string;
    cacheSize?: number;
}
export function useCachedAwaiter<T>(factory: () => Promise<T>, { deps, storeKey, cacheSize = 25 }: CachedAwaiterOptions) {
    const store: Store<T> = stores[storeKey] ??= { keys: new LinkedList(), values: {} };
    const cacheKey = deps.map(dep => JSON.stringify(dep)).join(":");
    const cached = store.values[cacheKey] || null;

    const [value, error, pending] = useAwaiter(factory, {
        fallbackValue: null,
        deps: [cacheKey],
        skipFetch: !!cached,
    });

    if (value != null) {
        if (store.values[cacheKey] == null) {
            // Shift cache if full
            if (store.keys.length >= cacheSize)
                for (const key of store.keys.splice(0, store.keys.length - cacheSize - 1))
                    delete store[key];

            store.keys.push(cacheKey);
        }

        store.values[cacheKey] = value;
    }

    return [cached ?? value, error, pending && !cached] as const;
}
