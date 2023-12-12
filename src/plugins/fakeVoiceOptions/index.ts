import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

export default definePlugin({
    name: "Fake Voice Options",
    description: "fake mute & deafen",
    authors: [Devs.SaucyDuck],
    patches: [
        {
            find: "e.setSelfMute(n),",
            replacement: [{
                // prevent client-side mute
                match: /e\.setSelfMute\(n\),/g,
                replace: 'e.setSelfMute(Vencord.Settings.plugins["Fake Voice Options"].fakeMute?false:n);'
            },
            {
                // prevent client-side deafen
                match: /e\.setSelfDeaf\(t\.deaf\)/g,
                replace: 'e.setSelfDeaf(Vencord.Settings.plugins["Fake Voice Options"].fakeDeafen?false:t.deaf);'
            }]
        },
    ],
    options: {
        fakeMute: {
            description: "Make everyone believe you're muted (you can still speak)",
            type: OptionType.BOOLEAN,
            default: false,
        },
        fakeDeafen: {
            description: "Make everyone believe you're deafened (you can still hear)",
            type: OptionType.BOOLEAN,
            default: false,
        },
    },
});