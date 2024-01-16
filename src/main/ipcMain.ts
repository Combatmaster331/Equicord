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

import "./updater";
import "./ipcPlugins";

import { debounce } from "@utils/debounce";
import { IpcEvents } from "@utils/IpcEvents";
import { Queue } from "@utils/Queue";
import { BrowserWindow, ipcMain, shell, systemPreferences } from "electron";
import { mkdirSync, readFileSync, watch } from "fs";
import { open, readdir, readFile, writeFile } from "fs/promises";
import { join, normalize } from "path";

import monacoHtml from "~fileContent/monacoWin.html;base64";

import { ALLOWED_PROTOCOLS, QUICKCSS_PATH, SETTINGS_DIR, SETTINGS_FILE, THEMES_DIR } from "./utils/constants";
import { makeLinksOpenExternally } from "./utils/externalLinks";

mkdirSync(SETTINGS_DIR, { recursive: true });
mkdirSync(THEMES_DIR, { recursive: true });

export function ensureSafePath(basePath: string, path: string) {
    const normalizedBasePath = normalize(basePath);
    const newPath = join(basePath, path);
    const normalizedPath = normalize(newPath);
    return normalizedPath.startsWith(normalizedBasePath) ? normalizedPath : null;
}

function readCss() {
    return readFile(QUICKCSS_PATH, "utf-8").catch(() => "");
}

function listThemes(): Promise<{ fileName: string; content: string; }[]> {
    return readdir(THEMES_DIR)
        .then(files =>
            Promise.all(files.map(async fileName => ({ fileName, content: await getThemeData(fileName) }))))
        .catch(() => []);
}

function getThemeData(fileName: string) {
    fileName = fileName.replace(/\?v=\d+$/, "");
    const safePath = ensureSafePath(THEMES_DIR, fileName);
    if (!safePath) return Promise.reject(`Unsafe path ${fileName}`);
    return readFile(safePath, "utf-8");
}

export function readSettings() {
    try {
        return readFileSync(SETTINGS_FILE, "utf-8");
    } catch {
        return "{}";
    }
}

export function getSettings(): typeof import("@api/Settings").Settings {
    try {
        return JSON.parse(readSettings());
    } catch {
        return {} as any;
    }
}

ipcMain.handle(IpcEvents.OPEN_QUICKCSS, () => shell.openPath(QUICKCSS_PATH));

ipcMain.handle(IpcEvents.OPEN_EXTERNAL, (_, url) => {
    try {
        var { protocol } = new URL(url);
    } catch {
        throw "Malformed URL";
    }
    if (!ALLOWED_PROTOCOLS.includes(protocol))
        throw "Disallowed protocol.";

    shell.openExternal(url);
});

const cssWriteQueue = new Queue();
const settingsWriteQueue = new Queue();

ipcMain.handle(IpcEvents.GET_QUICK_CSS, () => readCss());
ipcMain.handle(IpcEvents.SET_QUICK_CSS, (_, css) =>
    cssWriteQueue.push(() => writeFile(QUICKCSS_PATH, css))
);

ipcMain.handle(IpcEvents.GET_THEMES_DIR, () => THEMES_DIR);
ipcMain.handle(IpcEvents.GET_THEMES_LIST, () => listThemes());
ipcMain.handle(IpcEvents.GET_THEME_DATA, (_, fileName) => getThemeData(fileName));
ipcMain.handle(IpcEvents.GET_THEME_SYSTEM_VALUES, () => ({
    // win & mac only
    "os-accent-color": `#${systemPreferences.getAccentColor?.() || ""}`
}));

ipcMain.handle(IpcEvents.GET_SETTINGS_DIR, () => SETTINGS_DIR);
ipcMain.on(IpcEvents.GET_SETTINGS, e => e.returnValue = readSettings());

ipcMain.handle(IpcEvents.SET_SETTINGS, (_, s) => {
    settingsWriteQueue.push(() => writeFile(SETTINGS_FILE, s));
});


export function initIpc(mainWindow: BrowserWindow) {
    open(QUICKCSS_PATH, "a+").then(fd => {
        fd.close();
        watch(QUICKCSS_PATH, { persistent: false }, debounce(async () => {
            mainWindow.webContents.postMessage(IpcEvents.QUICK_CSS_UPDATE, await readCss());
        }, 50));
    });

    watch(THEMES_DIR, { persistent: false }, debounce(() => {
        mainWindow.webContents.postMessage(IpcEvents.THEME_UPDATE, void 0);
    }));
}

ipcMain.handle(IpcEvents.OPEN_MONACO_EDITOR, async () => {
    const title = "Equicord QuickCSS Editor";
    const existingWindow = BrowserWindow.getAllWindows().find(w => w.title === title);
    if (existingWindow && !existingWindow.isDestroyed()) {
        existingWindow.focus();
        return;
    }
    const win = new BrowserWindow({
        title,
        autoHideMenuBar: true,
        darkTheme: true,
        webPreferences: {
            preload: join(__dirname, IS_DISCORD_DESKTOP ? "preload.js" : "vencordDesktopPreload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    makeLinksOpenExternally(win);

    await win.loadURL(`data:text/html;base64,${monacoHtml}`);
});
