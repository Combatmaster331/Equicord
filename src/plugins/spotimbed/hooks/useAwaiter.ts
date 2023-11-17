/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useEffect, useState } from "@webpack/common";

type AwaiterRes<T> = [T, any, boolean];
interface AwaiterOpts<T> {
    fallbackValue: T,
    deps?: unknown[],
    onError?(e: any): void,
    /**
     * Whether the awaiter should skip fetching, using only the fallback value.
     * Useful for preventing unnecessary renders when the value is cached.
     */
    skipFetch?: boolean,
}
/**
 * Await a promise
 * @param factory Factory
 * @param fallbackValue The fallback value that will be used until the promise resolved
 * @returns [value, error, isPending]
 */
export function useAwaiter<T>(factory: () => Promise<T>): AwaiterRes<T | null>;
export function useAwaiter<T>(factory: () => Promise<T>, providedOpts: AwaiterOpts<T>): AwaiterRes<T>;
export function useAwaiter<T>(factory: () => Promise<T>, providedOpts?: AwaiterOpts<T | null>): AwaiterRes<T | null> {
    const opts: Required<AwaiterOpts<T | null>> = Object.assign({
        fallbackValue: null,
        deps: [],
        onError: null,
        skipFetch: false,
    }, providedOpts);
    const [state, setState] = useState({
        value: opts.fallbackValue,
        error: null,
        pending: !opts.skipFetch,
    });

    useEffect(() => {
        let isAlive = true;

        if (!opts.skipFetch) {
            if (!state.pending) setState({ ...state, pending: true });

            factory()
                .then(value => isAlive && setState({ value, error: null, pending: false }))
                .catch(error => isAlive && (setState({ value: null, error, pending: false }), opts.onError?.(error)));
        }

        return () => void (isAlive = false);
    }, opts.deps);

    return [state.value, state.error, state.pending];
}
