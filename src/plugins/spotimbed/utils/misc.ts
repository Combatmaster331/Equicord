/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@api/Styles";

export const cl = classNameFactory("vc-spotimbed-");

export const sortBy = <T, R extends number>(valueFn: (elem: T) => R) => (a: T, b: T) => {
    return valueFn(a) - valueFn(b);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpList = (a: number[], b: number[], t: number) => a.map((v, i) => lerp(v, b[i], t));

export function intersperse<T, S>(array: T[], separator: S): (T | S)[] {
    return array.flatMap((a, i) => i > 0 ? [separator, a] : [a]);
}
