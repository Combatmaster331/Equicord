/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { parseUrl } from "@utils/misc";

import { settings } from "../settings";
import { Artist, Resource, User } from "../types";
import { cl, intersperse } from "../utils/misc";

type Person = Artist | User;
export function Byline({ people }: { people: Person[]; }) {
    const by = people[0].type === "user"
        ? <ResourceLink resource={people[0]} />
        : <ResourceLinks resources={people} />;
    return <AttributionLine prep="by">{by}</AttributionLine>;
}

export function AttributionLine({ prep, children }: {
    prep: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cl("infoline")}>
            <span>{prep} </span>
            {children}
        </div>
    );
}

export function ResourceLink({ resource, className = "", title }: {
    resource: Resource;
    className?: string;
    title?: string;
}) {
    const { nativeLinks } = settings.use(["nativeLinks"]);
    const name = resource.type === "user" ? resource.display_name : resource.name;
    const url = parseUrl(resource.external_urls.spotify);
    const href = nativeLinks ? `spotify:/${url?.pathname}` : url?.href;

    return <a
        className={[cl("link"), ...className.split(" ")].join(" ")}
        href={href}
        data-resource-link={true}
        target="_blank"
        rel="noreferrer noopener"
        title={title == null ? name : (title || void 0)}
    >{name}</a>;
}

export function ResourceLinks({ resources, className = "" }: {
    resources: Resource[];
    className?: string;
}) {
    const names = resources.map(r => r.name).join(", ");
    const links = resources.map(r => <ResourceLink key={r.id} resource={r} className={className} />);
    return <span title={names}>{intersperse(links, ", ")}</span>;
}
