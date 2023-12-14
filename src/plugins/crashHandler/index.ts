/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
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

import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { closeAllModals } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { maybePromptToUpdate } from "@utils/updater";
import { filters, findBulk, proxyLazyWebpack } from "@webpack";
import { FluxDispatcher, NavigationRouter, SelectedChannelStore } from "@webpack/common";
import type { ReactElement } from "react";

const CrashHandlerLogger = new Logger("CrashHandler");
const { ModalStack, DraftManager, DraftType, closeExpressionPicker } = proxyLazyWebpack(() => {
    const modules = findBulk(
        filters.byProps("pushLazy", "popAll"),
        filters.byProps("clearDraft", "saveDraft"),
        filters.byProps("DraftType"),
        filters.byProps("closeExpressionPicker", "openExpressionPicker"),
    );

    return {
        ModalStack: modules[0],
        DraftManager: modules[1],
        DraftType: modules[2]?.DraftType,
        closeExpressionPicker: modules[3]?.closeExpressionPicker,
    };
});

const settings = definePluginSettings({
    attemptToPreventCrashes: {
        type: OptionType.BOOLEAN,
        description: "Whether to attempt to prevent Discord crashes.",
        default: true
    },
    attemptToNavigateToHome: {
        type: OptionType.BOOLEAN,
        description: "Whether to attempt to navigate to the home when preventing Discord crashes.",
        default: false
    }
});

let crashCount: number = 0;
let lastCrashTimestamp: number = 0;
let shouldAttemptNextHandle = false;

export default definePlugin({
    name: "CrashHandler",
    description: "Utility plugin for handling and possibly recovering from Crashes without a restart",
    authors: [Devs.Nuckyz],
    enabledByDefault: true,

    settings,

    patches: [
        {
            find: ".Messages.ERRORS_UNEXPECTED_CRASH",
            replacement: {
                match: /(?=this\.setState\()/,
                replace: "$self.handleCrash(this)||"
            }
        }
    ],

    handleCrash(_this: ReactElement & { forceUpdate: () => void; }) {
        if (Date.now() - lastCrashTimestamp <= 1_000 && !shouldAttemptNextHandle) return true;

        shouldAttemptNextHandle = false;

        if (++crashCount > 5) {
            try {
                showNotification({
                    color: "#eed202",
                    title: "Discord has crashed!",
                    body: "Awn :( Discord has crashed more than five times, not attempting to recover.",
                    noPersist: true,
                });
            } catch { }

            lastCrashTimestamp = Date.now();
            return false;
        }

        setTimeout(() => crashCount--, 60_000);

        try {
            if (crashCount === 1) maybePromptToUpdate("Uh oh, Discord has just crashed... but good news, there is a Vencord update available that might fix this issue! Would you like to update now?", true);

            if (settings.store.attemptToPreventCrashes) {
                this.handlePreventCrash(_this);
                return true;
            }

            return false;
        } catch (err) {
            CrashHandlerLogger.error("Failed to handle crash", err);
            return false;
        } finally {
            lastCrashTimestamp = Date.now();
        }
    },

    handlePreventCrash(_this: ReactElement & { forceUpdate: () => void; }) {
        if (Date.now() - lastCrashTimestamp >= 1_000) {
            try {
                showNotification({
                    color: "#eed202",
                    title: "Discord has crashed!",
                    body: "Attempting to recover...",
                    noPersist: true,
                });
            } catch { }
        }

        try {
            const channelId = SelectedChannelStore.getChannelId();

            DraftManager.clearDraft(channelId, DraftType.ChannelMessage);
            DraftManager.clearDraft(channelId, DraftType.FirstThreadMessage);
        } catch (err) {
            CrashHandlerLogger.debug("Failed to clear drafts.", err);
        }
        try {
            closeExpressionPicker();
        }
        catch (err) {
            CrashHandlerLogger.debug("Failed to close expression picker.", err);
        }
        try {
            FluxDispatcher.dispatch({ type: "CONTEXT_MENU_CLOSE" });
        } catch (err) {
            CrashHandlerLogger.debug("Failed to close open context menu.", err);
        }
        try {
            ModalStack.popAll();
        } catch (err) {
            CrashHandlerLogger.debug("Failed to close old modals.", err);
        }
        try {
            closeAllModals();
        } catch (err) {
            CrashHandlerLogger.debug("Failed to close all open modals.", err);
        }
        try {
            FluxDispatcher.dispatch({ type: "USER_PROFILE_MODAL_CLOSE" });
        } catch (err) {
            CrashHandlerLogger.debug("Failed to close user popout.", err);
        }
        try {
            FluxDispatcher.dispatch({ type: "LAYER_POP_ALL" });
        } catch (err) {
            CrashHandlerLogger.debug("Failed to pop all layers.", err);
        }
        if (settings.store.attemptToNavigateToHome) {
            try {
                NavigationRouter.transitionTo("/channels/@me");
            } catch (err) {
                CrashHandlerLogger.debug("Failed to navigate to home", err);
            }
        }

        try {
            shouldAttemptNextHandle = true;
            _this.forceUpdate();
        } catch (err) {
            CrashHandlerLogger.debug("Failed to update crash handler component.", err);
        }
    }
});
