/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { quantize } from "gifenc";

import { Resource } from "../types";

const DEFAULT_PALETTE: RgbPalette = [[0, 0, 0]];

export type RgbPalette = number[][];

export async function getPaletteFromUrl(url: string, imgSize: number, paletteSize: number): Promise<RgbPalette> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return DEFAULT_PALETTE;

    const image = await getLoadedImageFromUrl(url);
    canvas.width = image.width = imgSize;
    canvas.height = image.height = imgSize;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    return quantize(imageData.data, paletteSize);
}

export function getLoadedImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = error => reject(error);
        image.src = url;
    });
}

export async function getDataUrlFromUrl(url: string) {
    const blob = await fetch(url).then(r => r.blob());
    const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
    return base64;
}

export function getImageSmallestAtLeast(resource: Resource, size: number) {
    const images = (() => {
        if ("images" in resource) return resource.images;
        else if (resource.type === "track") return resource.album.images;
        return null;
    })();

    if (!images?.length) return null;

    return images.reduce((prev, curr) => {
        let prevDiff = prev.width - size;
        let currDiff = curr.width - size;
        if (prevDiff < 0) prevDiff = Infinity;
        if (currDiff < 0) currDiff = Infinity;
        return currDiff < prevDiff ? curr : prev;
    });
}
