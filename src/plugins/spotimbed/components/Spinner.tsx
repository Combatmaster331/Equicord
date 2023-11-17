/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByPropsLazy } from "@webpack";
import type { FC } from "react";

export const enum SpinnerType {
    SpinningCircle = "spinningCircle",
    ChasingDots = "chasingDots",
    LowMotion = "lowMotion",
    PulsingEllipsis = "pulsingEllipsis",
    WanderingCubes = "wanderingCubes",
}

export interface SpinnerProps {
    type: SpinnerType;
    animated?: boolean;
    className?: string;
    itemClassName?: string;
}

export const Spinner: FC<SpinnerProps> = findByPropsLazy("Spinner", "SpinnerTypes");
