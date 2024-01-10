/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType, StartAt } from "@utils/types";
import { Forms, Menu, TextInput, useState } from "@webpack/common";
import { cooldown, denormalize, normalize } from "./utils";
import { goofs } from "./goofs";

const settings = definePluginSettings({
    maxFPS: {
        description: "Max FPS for the range slider",
        default: 144,
        type: OptionType.COMPONENT,
        component: (props: any) => {
            const [value, setValue] = useState(settings.store.maxFPS);
            return <Forms.FormSection>
                <Forms.FormTitle>Max FPS for the range slider</Forms.FormTitle>
                <TextInput type="number" pattern="-?[0-9]+" onChange={value => { props.setValue(Math.max(Number.parseInt(value), 1)); setValue(value); }} value={value} />
            </Forms.FormSection>;
        }
    },
    maxResolution: {
        description: "Max Resolution for the range slider",
        default: 1080,
        type: OptionType.COMPONENT,
        component: (props: any) => {
            const [value, setValue] = useState(settings.store.maxResolution);
            return <Forms.FormSection>
                <Forms.FormTitle>Max Resolution for the range slider</Forms.FormTitle>
                <TextInput type="number" pattern="-?[0-9]+" onChange={value => { props.setValue(Math.max(Number.parseInt(value), 22)); setValue(value); }} value={value} />
            </Forms.FormSection>;
        }
    },
    roundValues: {
        description: "Round Resolution and FPS values to the nearest whole number",
        default: true,
        type: OptionType.BOOLEAN,
    },
    goofs: {
        description: "Goofs and gags :^)",
        default: false,
        type: OptionType.BOOLEAN,
        restartNeeded: true,
    },
});

export default definePlugin({
    name: "CustomScreenShare",
    description: "Stream any resolution and any FPS!",
    authors: [Devs.KawaiianPizza],
    settingsAboutComponent: () => (
        <Forms.FormSection>
            <Forms.FormTitle tag="h3">Usage</Forms.FormTitle>
            <Forms.FormText>
                Adds a slider for the quality and fps options submenu
            </Forms.FormText>
        </Forms.FormSection>),
    settings,
    patches: [
        {
            find: "ApplicationStreamSettingRequirements)",
            replacement: {
                match: /for\(let . of ..ApplicationStreamSettingRequirements\).+?!1/,
                replace: "return !0"
            }
        },
        {
            find: "ApplicationStreamFPSButtonsWithSuffixLabel.map",
            replacement: {
                match: /(.=)(.{19}FPS.+?([A-z]{1,2}).{11}>([A-z]{1,2}).[A-z]{1,2},([A-z]{1,2}),[A-z]{1,2},([A-z.]+).+?\}\)),/,
                replace: "$1[$self.CustomRange($4,$5,$3,$6,'fps'),...$2],"
            }
        },
        {
            find: "ApplicationStreamResolutionButtonsWithSuffixLabel.map",
            replacement: {
                match: /(.=)(.{19}Resolution.+?([A-z]{1,2}).{11}>([A-z]{1,2}).[A-z]{1,2},[A-z]{1,2},([A-z]{1,2}),([A-z.]+).+?\}\));/,
                replace: "$1[$self.CustomRange($4,$3,$5,$6,'resolution'),...$2];"
            }
        },
        {
            find: "=4e6",
            replacement: {
                match: /=4e6/,
                replace: "=10e6"
            }
        },
        {
            find: "=8e6",
            replacement: {
                match: /=8e6/,
                replace: "=10e6"
            }
        },
        {
            find: "\"Discord_Clip_\".concat",
            replacement: {
                match: /(=15e)3/, // disable discord idle fps reduction
                replace: "$18"
            }
        },
        {
            find: "updateRemoteWantsFramerate(){",
            replacement: {
                match: /updateRemoteWantsFramerate..\{/, // disable discord mute fps reduction
                replace: "$&return;"
            }
        },
        {
            find: "=8e6",
            replacement: {
                match: /=8e6/,
                replace: "=10e6"
            }
        }
    ],
    CustomRange(changeRes: Function, res: number, fps: number, analytics: string, group: "fps" | "resolution") {
        const [value, setValue] = useState(group === "fps" ? fps : res);
        const { maxFPS, maxResolution, roundValues } = settings.store;

        let maxValue = group === "fps" ? maxFPS : maxResolution,
            minValue = group === "fps" ? 1 : 22; // 0 FPS freezes (obviously) and anything less than 22p doesn't work

        let onChange = (number: number) => {
            let tmp = denormalize(number, minValue, maxValue);
            if (roundValues)
                tmp = Math.round(tmp);
            setValue(tmp);
            cooldown(() => changeRes(true, group === "resolution" ? tmp : res, group === "fps" ? tmp : fps, analytics));
        };
        return (<Menu.MenuControlItem group={`stream-settings-${group}`} id={`stream-settings-${group}-custom`}>
            <Menu.MenuSliderControl
                onChange={onChange}
                renderValue={() => value + (group === "fps" ? " FPS" : "p")}
                value={normalize((group === "fps" ? fps : res), minValue, maxValue)}>
            </Menu.MenuSliderControl>
        </Menu.MenuControlItem>);
    },
    start() {
        if (settings.store.goofs)
            goofs();
    },
    startAt: StartAt.DOMContentLoaded
});
