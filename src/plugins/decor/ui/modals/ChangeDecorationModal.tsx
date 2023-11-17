/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { LazyComponent } from "@utils/react";
import { findByCode, findByPropsLazy } from "@webpack";
import { Alerts, Button, FluxDispatcher, Forms, GuildStore, NavigationRouter, Parser, Text, Tooltip, useEffect, UserStore, UserUtils, useState } from "@webpack/common";
import { User } from "discord-types/general";

import { Decoration, getPresets, Preset } from "../../lib/api";
import { GUILD_ID, INVITE_KEY } from "../../lib/constants";
import { useAuthorizationStore } from "../../lib/stores/AuthorizationStore";
import { useCurrentUserDecorationsStore } from "../../lib/stores/CurrentUserDecorationsStore";
import cl from "../../lib/utils/cl";
import discordifyDecoration from "../../lib/utils/discordifyDecoration";
import openInviteModal from "../../lib/utils/openInviteModal";
import requireAvatarDecorationModal from "../../lib/utils/requireAvatarDecorationModal";
import { AvatarDecorationModalPreview } from "../components";
import DecorationGridCreate from "../components/DecorationGridCreate";
import DecorationGridNone from "../components/DecorationGridNone";
import DecorDecorationGridDecoration from "../components/DecorDecorationGridDecoration";
import SectionedGridList from "../components/SectionedGridList";
import { openCreateDecorationModal } from "./CreateDecorationModal";

const UserSummaryItem = LazyComponent(() => findByCode("defaultRenderUser", "showDefaultAvatarsForNullUsers"));
const DecorationModalStyles = findByPropsLazy("modalFooterShopButton");

interface Section {
    title: string;
    subtitle?: string;
    sectionKey: string;
    items: ("none" | "create" | Decoration)[];
    authorIds?: string[];
}

function SectionHeader({ section }: { section: Section; }) {
    const hasSubtitle = typeof section.subtitle !== "undefined";
    const hasAuthorIds = typeof section.authorIds !== "undefined";

    const [authors, setAuthors] = useState<User[]>([]);

    useEffect(() => {
        (async () => {
            if (!section.authorIds) return;

            for (const authorId of section.authorIds) {
                const author = UserStore.getUser(authorId) ?? await UserUtils.getUser(authorId);
                setAuthors(authors => [...authors, author]);
            }
        })();
    }, [section.authorIds]);

    return <div>
        <div style={{ display: "flex" }}>
            <Forms.FormTitle style={{ flexGrow: 1 }}>{section.title}</Forms.FormTitle>
            {hasAuthorIds && <UserSummaryItem
                users={authors}
                guildId={undefined}
                renderIcon={false}
                max={5}
                showDefaultAvatarsForNullUsers
                size={16}
                showUserPopout
                className={Margins.bottom8}
            />
            }
        </div>
        {hasSubtitle &&
            <Forms.FormText type="description" className={Margins.bottom8}>
                {section.subtitle}
            </Forms.FormText>
        }
    </div>;
}

export default function ChangeDecorationModal(props: any) {
    // undefined = not trying, null = none, Decoration = selected
    const [tryingDecoration, setTryingDecoration] = useState<Decoration | null | undefined>(undefined);
    const isTryingDecoration = typeof tryingDecoration !== "undefined";

    const {
        decorations,
        selectedDecoration,
        fetch: fetchUserDecorations,
        select: selectDecoration
    } = useCurrentUserDecorationsStore();

    useEffect(() => {
        fetchUserDecorations();
    }, []);

    const activeSelectedDecoration = isTryingDecoration ? tryingDecoration : selectedDecoration;
    const activeDecorationHasAuthor = typeof activeSelectedDecoration?.authorId !== "undefined";
    const hasPendingReview = decorations.some(d => d.reviewed === false);

    const [presets, setPresets] = useState<Preset[]>([]);
    useEffect(() => { getPresets().then(setPresets); }, []);
    const presetDecorations = presets.flatMap(preset => preset.decorations);

    const activeDecorationPreset = presets.find(preset => preset.id === activeSelectedDecoration?.presetId);
    const isActiveDecorationPreset = typeof activeDecorationPreset !== "undefined";

    const ownDecorations = decorations.filter(d => !presetDecorations.some(p => p.hash === d.hash));

    const data = [
        {
            title: "Your Decorations",
            sectionKey: "ownDecorations",
            items: ["none", ...ownDecorations, "create"]
        },
        ...presets.map(preset => ({
            title: preset.name,
            subtitle: preset.description || undefined,
            sectionKey: `preset-${preset.id}`,
            items: preset.decorations,
            authorIds: preset.authorIds
        }))
    ] as Section[];

    return <ModalRoot
        {...props}
        size={ModalSize.DYNAMIC}
        className={DecorationModalStyles.modal}
    >
        <ModalHeader separator={false} className={cl("modal-header")}>
            <Text
                color="header-primary"
                variant="heading-lg/semibold"
                tag="h1"
                style={{ flexGrow: 1 }}
            >
                Change Decoration
            </Text>
            <ModalCloseButton onClick={props.onClose} />
        </ModalHeader>
        <ModalContent
            className={cl("change-decoration-modal-content")}
            scrollbarType="none"
        >
            <SectionedGridList
                renderItem={item => {
                    if (typeof item === "string") {
                        switch (item) {
                            case "none":
                                return <DecorationGridNone
                                    className={cl("change-decoration-modal-decoration")}
                                    isSelected={activeSelectedDecoration === null}
                                    onSelect={() => setTryingDecoration(null)}
                                />;
                            case "create":
                                return <Tooltip text="You already have a decoration pending review" shouldShow={hasPendingReview}>
                                    {tooltipProps => <DecorationGridCreate
                                        className={cl("change-decoration-modal-decoration")}
                                        {...tooltipProps}
                                        onSelect={!hasPendingReview ? openCreateDecorationModal : () => { }}
                                    />}
                                </Tooltip>;
                        }
                    } else {
                        return <Tooltip text={"Pending review"} shouldShow={item.reviewed === false}>
                            {tooltipProps => (
                                <DecorDecorationGridDecoration
                                    {...tooltipProps}
                                    className={cl("change-decoration-modal-decoration")}
                                    onSelect={item.reviewed !== false ? () => setTryingDecoration(item) : () => { }}
                                    isSelected={activeSelectedDecoration?.hash === item.hash}
                                    decoration={item}
                                />
                            )}
                        </Tooltip>;
                    }
                }}
                getItemKey={item => typeof item === "string" ? item : item.hash}
                getSectionKey={section => section.sectionKey}
                renderSectionHeader={section => <SectionHeader section={section} />}
                sections={data}
            />
            <div className={cl("change-decoration-modal-preview")}>
                <AvatarDecorationModalPreview
                    avatarDecorationOverride={isTryingDecoration ? tryingDecoration ? discordifyDecoration(tryingDecoration) : null : undefined}
                    user={UserStore.getCurrentUser()}
                />
                {isActiveDecorationPreset && <Forms.FormTitle className="">Part of the {activeDecorationPreset.name} Preset</Forms.FormTitle>}
                {typeof activeSelectedDecoration === "object" &&
                    <Text
                        variant="text-sm/semibold"
                        color="header-primary"
                    >
                        {activeSelectedDecoration?.alt}
                    </Text>
                }
                {activeDecorationHasAuthor && <Text key={`createdBy-${activeSelectedDecoration.authorId}`}>Created by {Parser.parse(`<@${activeSelectedDecoration.authorId}>`)}</Text>}
            </div>
        </ModalContent>
        <ModalFooter className={classes(cl("change-decoration-modal-footer", cl("modal-footer")))}>
            <div className={cl("change-decoration-modal-footer-btn-container")}>
                <Button
                    onClick={() => {
                        selectDecoration(tryingDecoration!).then(props.onClose);
                    }}
                    disabled={!isTryingDecoration}
                >
                    Apply
                </Button>
                <Button
                    onClick={props.onClose}
                    color={Button.Colors.PRIMARY}
                    look={Button.Looks.LINK}
                >
                    Cancel
                </Button>
            </div>
            <div className={cl("change-decoration-modal-footer-btn-container")}>
                <Button
                    onClick={() => Alerts.show({
                        title: "Log Out",
                        body: "Are you sure you want to log out of Decor?",
                        confirmText: "Log Out",
                        confirmColor: cl("danger-btn"),
                        cancelText: "Cancel",
                        onConfirm() {
                            useAuthorizationStore.getState().remove(UserStore.getCurrentUser().id);
                            props.onClose();
                        }
                    })}
                    color={Button.Colors.PRIMARY}
                    look={Button.Looks.LINK}
                >
                    Log Out
                </Button>
                <Tooltip text="Join Decor's Discord Server for notifications on your decoration's review, and when new presets are released">
                    {tooltipProps => <Button
                        {...tooltipProps}
                        onClick={() => {
                            if (!GuildStore.getGuild(GUILD_ID)) {
                                openInviteModal(INVITE_KEY);
                            } else {
                                props.onClose();
                                FluxDispatcher.dispatch({ type: "LAYER_POP_ALL" });
                                NavigationRouter.transitionToGuild(GUILD_ID);
                            }
                        }}
                        color={Button.Colors.PRIMARY}
                        look={Button.Looks.LINK}
                    >
                        Discord Server
                    </Button>}
                </Tooltip>
            </div>
        </ModalFooter>
    </ModalRoot>;
}

export const openChangeDecorationModal = () =>
    requireAvatarDecorationModal().then(() => openModal(props => <ChangeDecorationModal {...props} />));
