import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";;

export default definePlugin({
    name: "Equicordo",
    description: "Replaces the discordo sound on startup with something a bit more interesting",
    authors: [Devs.echo, Devs.thororen],
    patches: [{
        find: "ae7d16bb2eea76b9b9977db0fad66658.mp3",
        replacement: {
            match: /e\.exports=n\.p\+"[a-zA-Z0-9]+\.mp3"/,
            replace: 'e.exports="https://github.com/Equicord/Ignore/raw/main/equicordo.mp3";'
        }
    }]
});
