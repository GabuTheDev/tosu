import {
    downloadFile,
    getCachePath,
    getStaticPath,
    platformResolver,
    unzip,
    wLogger,
    walkDirectory
} from '@tosu/common';
import { exec } from 'child_process';
import fs from 'fs';
import https from 'https';
import path from 'path';

import { HttpServer, sendJson } from '../index';
import { ExtendedIncomingMessage, ServerResponse } from '../utils/http';

export interface Overlay {
    id?: string;
    name: string;
    author: string;
    version: string;
    source: 'local' | 'repository';
    isInstalled: boolean;
    localPath?: string;
    downloadUrl?: string;
    metadata: {
        usecase: string[];
        compatible: string[];
        resolution: (string | number)[];
        hasSettings: boolean;
        authorLinks: string[];
        notes: string;
    };
}

export function parseMetadata(content: string) {
    const lines = content.split(/\r?\n/);
    const metadata: Record<string, string> = {};

    for (const line of lines) {
        const cleanLine = line.split('##')[0];
        const index = cleanLine.indexOf(':');

        if (index !== -1) {
            const key = cleanLine.slice(0, index).trim().toLowerCase();
            const value = cleanLine.slice(index + 1).trim();
            if (key) metadata[key] = value;
        }
    }

    return metadata;
}

async function getLocalOverlays(): Promise<Overlay[]> {
    const staticPath = getStaticPath();
    const entries = walkDirectory(staticPath, {
        maxDepth: 1,
        includeTypes: true
    });

    const splitByComma = (v?: string) =>
        v ? v.split(',').map((s) => s.trim()) : [];

    const parseResolution = (v?: string) => {
        if (!v) return [-1, -1];
        return v.split(/[x ]+/).map((s) => {
            const n = Number(s.trim());
            return isNaN(n) ? s.trim() : n;
        });
    };

    return entries
        .filter((entry) => {
            if (entry.type !== 'directory') return false;
            return fs.existsSync(path.join(entry.path, 'index.html'));
        })
        .map((entry) => {
            const metadataTxtPath = path.join(entry.path, 'metadata.txt');
            const hasMetadata = fs.existsSync(metadataTxtPath);
            const parsed = hasMetadata
                ? parseMetadata(fs.readFileSync(metadataTxtPath, 'utf8'))
                : ({} as Record<string, string>);

            let name = parsed.name;
            let author = parsed.author;

            if (!name || !author) {
                const parts = entry.name.split(' by ');
                if (parts.length === 2) {
                    name = name || parts[0];
                    author = author || parts[1];
                }
            }

            return {
                name: name || entry.name,
                author: author || 'unknown',
                version: parsed.version || '1.0.0',
                source: 'local',
                isInstalled: true,
                localPath: entry.path,
                metadata: {
                    usecase: splitByComma(parsed.usecase),
                    compatible: splitByComma(parsed.compatiblewith),
                    resolution: parseResolution(parsed.resolution),
                    hasSettings: false,
                    authorLinks: splitByComma(parsed.authorlinks),
                    notes: parsed.notes || ''
                }
            };
        });
}

function fetchRepoData(): Promise<any> {
    return new Promise((resolve, reject) => {
        https
            .get('https://tosu.app/api.json', (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            })
            .on('error', reject);
    });
}

async function getRepoOverlays(): Promise<Overlay[]> {
    try {
        const repoData = await fetchRepoData();
        return repoData.map((item: any) => ({
            id: item.id,
            name: item.name,
            author: item.author,
            version: item.version,
            source: 'repository',
            isInstalled: false,
            downloadUrl: item.downloadLink,
            metadata: {
                usecase: item.usecase || [],
                compatible: item.compatiblewith || [],
                resolution: item.resolution || [-1, -1],
                hasSettings: item._settings || false,
                authorLinks: item.authorlinks || [],
                notes: item.notes || ''
            }
        }));
    } catch (error) {
        wLogger.error(
            'Failed to fetch repo overlays:',
            (error as Error).message
        );
        return [];
    }
}

export default function buildOverlaysApi(app: HttpServer) {
    const getOverlaysHandler = async (
        req: ExtendedIncomingMessage,
        res: ServerResponse
    ) => {
        try {
            const source = req.query.source || 'local';

            let localOverlays: Overlay[] = [];
            let repoOverlays: Overlay[] = [];

            if (source === 'local' || source === 'all') {
                localOverlays = await getLocalOverlays();
            }

            if (source === 'repository' || source === 'all') {
                repoOverlays = await getRepoOverlays();
            }

            if (source === 'all') {
                const unifiedOverlays: Overlay[] = [...localOverlays];

                repoOverlays.forEach((repoOverlay) => {
                    const local = localOverlays.find(
                        (l) =>
                            l.name.toLowerCase() ===
                                repoOverlay.name.toLowerCase() &&
                            l.author.toLowerCase() ===
                                repoOverlay.author.toLowerCase()
                    );
                    if (local) {
                        local.isInstalled = true;
                        local.id = repoOverlay.id;
                        local.downloadUrl = repoOverlay.downloadUrl;
                    } else {
                        unifiedOverlays.push({
                            ...repoOverlay,
                            isInstalled: false
                        });
                    }
                });

                return sendJson(res, unifiedOverlays);
            }

            return sendJson(
                res,
                source === 'local' ? localOverlays : repoOverlays
            );
        } catch (error) {
            wLogger.error(
                'Failed to fetch overlays:',
                (error as Error).message
            );
            return sendJson(res, { error: 'Internal server error' }, 500);
        }
    };

    const downloadOverlayHandler = async (
        req: ExtendedIncomingMessage,
        res: ServerResponse
    ) => {
        const folderName = path.basename(
            decodeURIComponent(req.params.id || req.query.name)
        );
        const downloadUrl = req.query.url || req.params.url;

        if (!downloadUrl)
            return sendJson(res, { error: 'No download URL provided' }, 400);

        const cacheFolder = getCachePath();
        const staticPath = getStaticPath();
        const folderPath = path.join(staticPath, folderName);
        const tempPath = path.join(cacheFolder, `${Date.now()}.zip`);

        try {
            if (!fs.existsSync(cacheFolder))
                fs.mkdirSync(cacheFolder, { recursive: true });

            await downloadFile(downloadUrl, tempPath);
            await unzip(tempPath, folderPath);
            fs.unlinkSync(tempPath);

            wLogger.info(`Overlay %${folderName}% downloaded and installed.`);
            return sendJson(res, { status: 'success', path: folderPath });
        } catch (error) {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            wLogger.error(
                `Failed to download overlay %${folderName}%:`,
                (error as Error).message
            );
            return sendJson(res, { error: (error as Error).message }, 500);
        }
    };

    const openOverlayHandler = async (
        req: ExtendedIncomingMessage,
        res: ServerResponse
    ) => {
        const folderName = path.basename(
            decodeURIComponent(req.params.id || req.params.name)
        );
        const staticPath = getStaticPath();
        const folderPath = path.join(staticPath, folderName);

        if (!fs.existsSync(folderPath))
            return sendJson(res, { error: "Folder doesn't exist" }, 404);

        const platform = platformResolver(process.platform);
        exec(`${platform.command} "${folderPath}"`, (err) => {
            if (err) {
                wLogger.error(
                    `Failed to open folder %${folderName}%:`,
                    err.message
                );
                return sendJson(res, { error: err.message }, 500);
            }
            return sendJson(res, { status: 'opened' });
        });
    };

    const deleteOverlayHandler = async (
        req: ExtendedIncomingMessage,
        res: ServerResponse
    ) => {
        const folderName = path.basename(
            decodeURIComponent(req.params.id || req.params.name)
        );
        const staticPath = getStaticPath();
        const folderPath = path.join(staticPath, folderName);

        if (!fs.existsSync(folderPath))
            return sendJson(res, { error: "Folder doesn't exist" }, 404);

        try {
            fs.rmSync(folderPath, { recursive: true, force: true });
            wLogger.info(`Overlay %${folderName}% deleted.`);
            return sendJson(res, { status: 'deleted' });
        } catch (error) {
            wLogger.error(
                `Failed to delete overlay %${folderName}%:`,
                (error as Error).message
            );
            return sendJson(res, { error: (error as Error).message }, 500);
        }
    };

    app.route('/api/overlays', 'GET', getOverlaysHandler);
    app.route('/api/counters', 'GET', getOverlaysHandler);

    app.route(
        /^\/api\/overlays\/(?<id>.*)\/download/,
        'POST',
        downloadOverlayHandler
    );
    app.route(
        /^\/api\/counters\/(?<id>.*)\/download/,
        'POST',
        downloadOverlayHandler
    );

    app.route(/^\/api\/overlays\/(?<id>.*)\/open/, 'POST', openOverlayHandler);
    app.route(/^\/api\/counters\/(?<id>.*)\/open/, 'POST', openOverlayHandler);

    app.route(/^\/api\/overlays\/(?<id>.*)/, 'DELETE', deleteOverlayHandler);
    app.route(/^\/api\/counters\/(?<id>.*)/, 'DELETE', deleteOverlayHandler);

    // Fallbacks
    app.route(
        /^\/api\/overlays\/search\/(?<query>.*)/,
        'GET',
        async (req, res) => {
            const overlays = await getLocalOverlays();
            return sendJson(res, overlays);
        }
    );
    app.route(
        /^\/api\/counters\/search\/(?<query>.*)/,
        'GET',
        async (req, res) => {
            const overlays = await getLocalOverlays();
            return sendJson(res, overlays);
        }
    );

    app.route(
        /^\/api\/overlays\/download\/(?<url>.*)/,
        'GET',
        downloadOverlayHandler
    );
    app.route(
        /^\/api\/counters\/download\/(?<url>.*)/,
        'GET',
        downloadOverlayHandler
    );

    app.route(/^\/api\/overlays\/open\/(?<name>.*)/, 'GET', openOverlayHandler);
    app.route(/^\/api\/counters\/open\/(?<name>.*)/, 'GET', openOverlayHandler);

    app.route(
        /^\/api\/overlays\/delete\/(?<name>.*)/,
        'GET',
        deleteOverlayHandler
    );
    app.route(
        /^\/api\/counters\/delete\/(?<name>.*)/,
        'GET',
        deleteOverlayHandler
    );
}
