import rosu from '@kotrikd/rosu-pp';
import {
    ConfigKey,
    ConfigManager,
    JsonSafeParse,
    config,
    defaultSchema,
    getDashboardPath,
    getStaticPath,
    wLogger
} from '@tosu/common';
import { autoUpdater } from '@tosu/updater';
import fs from 'fs';
import path from 'path';

import { Server, sendJson } from '../index';
import { getContentType } from '../utils';
import { directoryWalker } from '../utils/directories';
import { generateReport, generateReportHTML } from '../utils/report';

export default function buildBaseApi(server: Server) {
    server.app.route('/json', 'GET', (req, res) => {
        const osuInstance: any = req.instanceManager.getInstance(
            req.instanceManager.focusedClient
        );
        if (!osuInstance) {
            throw new Error('osu is not ready/running');
        }

        const json = osuInstance.getState(req.instanceManager);
        return sendJson(res, json);
    });

    server.app.route('/api/settings', 'GET', (req, res) => {
        return sendJson(res, config);
    });

    server.app.route('/api/settings', 'PATCH', async (req, res) => {
        const body: Record<string, any> | Error = JsonSafeParse({
            isFile: false,
            payload: req.body,
            defaultValue: new Error('Failed to parse body')
        });
        if (body instanceof Error) throw body;

        const transformed: Record<string, string> = {};
        for (const [key, value] of Object.entries(body)) {
            const schemaItem = defaultSchema[key as ConfigKey];
            if (schemaItem) {
                transformed[schemaItem.binding] = String(value);
            }
        }

        ConfigManager.refreshConfig(transformed, true);
        return sendJson(res, { status: 'updated' });
    });

    server.app.route('/api/runUpdates', 'GET', (req, res) =>
        autoUpdater('server', res)
    );

    server.app.route('/api/calculate/pp', 'GET', (req, res) => {
        const query: any = req.query;

        const osuInstance: any = req.instanceManager.getInstance(
            req.instanceManager.focusedClient
        );
        if (!osuInstance) {
            throw new Error('osu is not ready/running');
        }

        const { global, menu, beatmapPP } = osuInstance.getServices([
            'global',
            'menu',
            'beatmapPP'
        ]);

        let beatmap: rosu.Beatmap;
        const exists = fs.existsSync(query.path);
        if (exists) {
            const beatmapFilePath = path.join(
                global.songsFolder,
                menu.folder,
                menu.filename
            );

            const beatmapContent = fs.readFileSync(beatmapFilePath, 'utf8');
            beatmap = new rosu.Beatmap(beatmapContent);
        } else {
            beatmap = beatmapPP.getCurrentBeatmap();
        }

        if (query.mode !== undefined) beatmap.convert(query.mode);

        const params: rosu.PerformanceArgs = {};

        if (query.ar !== undefined) params.ar = +query.ar;
        if (query.cs !== undefined) params.cs = +query.cs;
        if (query.hp !== undefined) params.hp = +query.hp;
        if (query.od !== undefined) params.od = +query.od;

        if (query.clockRate !== undefined) params.clockRate = +query.clockRate;
        if (query.passedObjects !== undefined)
            params.passedObjects = +query.passedObjects;
        if (query.combo !== undefined) params.combo = +query.combo;
        if (query.nMisses !== undefined) params.misses = +query.nMisses;
        if (query.n100 !== undefined) params.n100 = +query.n100;
        if (query.n300 !== undefined) params.n300 = +query.n300;
        if (query.n50 !== undefined) params.n50 = +query.n50;
        if (query.nGeki !== undefined) params.nGeki = +query.nGeki;
        if (query.nKatu !== undefined) params.nKatu = +query.nKatu;
        if (query.mods !== undefined)
            params.mods = Array.isArray(query.mods) ? query.mods : +query.mods;
        if (query.acc !== undefined) params.accuracy = +query.acc;
        if (query.sliderEndHits !== undefined)
            params.sliderEndHits = +query.sliderEndHits;
        if (query.smallTickHits !== undefined)
            params.smallTickHits = +query.smallTickHits;
        if (query.largeTickHits !== undefined)
            params.largeTickHits = +query.largeTickHits;
        if (query.hitresultPriority !== undefined)
            params.hitresultPriority = +query.hitresultPriority;

        const calculate = new rosu.Performance(params).calculate(beatmap);
        sendJson(res, calculate);

        // free beatmap only when map path specified
        if (query.path) beatmap.free();
        calculate.free();
    });

    server.app.route('/api/generateReport', 'GET', async (req, res) => {
        try {
            const report = await generateReport(req.instanceManager);
            const html = await generateReportHTML(report);

            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(`tosu-report-${report.date.getTime()}.html`)}"`
            });
            res.end(html, 'utf-8');
        } catch (err) {
            res.writeHead(500, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            res.end(
                `Server Error: ${(err as Error).message || 'Unknown error'}`
            );
        }
    });

    server.app.route(/.*/, 'GET', async (req, res) => {
        const url = req.pathname || '/';
        try {
            if (url.startsWith(`/.well-know`)) {
                res.statusCode = 404;
                res.statusMessage = 'Not Found';
                return res.end();
            }

            const staticPath = getStaticPath();
            const dashboardPath = getDashboardPath();

            // TODO: Redo this mess.

            let relativePath = url;
            if (relativePath === '/') relativePath = 'index.html';
            if (relativePath.startsWith('/'))
                relativePath = relativePath.substring(1);

            const dashboardFilePath = path.join(dashboardPath, relativePath);

            if (
                fs.existsSync(dashboardFilePath) &&
                !fs.statSync(dashboardFilePath).isDirectory()
            ) {
                const contentType = getContentType(dashboardFilePath);
                res.writeHead(200, { 'Content-Type': contentType });
                return fs.createReadStream(dashboardFilePath).pipe(res);
            }

            if (url !== '/') {
                const potentialCounterPath = path.join(
                    staticPath,
                    decodeURIComponent(url)
                );
                if (fs.existsSync(potentialCounterPath)) {
                    const stats = fs.statSync(potentialCounterPath);
                    const isDir = stats.isDirectory();

                    if (
                        !isDir ||
                        fs.existsSync(
                            path.join(potentialCounterPath, 'index.html')
                        )
                    ) {
                        return directoryWalker({
                            _htmlRedirect: true,
                            res,
                            baseUrl: url,
                            pathname: url.endsWith('/')
                                ? url + 'index.html'
                                : url,
                            folderPath: staticPath
                        });
                    }
                }
            }

            const dashboardIndexPath = path.join(dashboardPath, 'index.html');
            if (fs.existsSync(dashboardIndexPath)) {
                res.writeHead(200, {
                    'Content-Type': 'text/html; charset=utf-8'
                });
                return fs.createReadStream(dashboardIndexPath).pipe(res);
            }

            if (url === '/') {
                res.writeHead(200, {
                    'Content-Type': 'text/html; charset=utf-8'
                });
                return res.end(
                    '<h1>tosu</h1><p>Dashboard not found. Please run <code>pnpm run build</code> in <code>packages/dashboard</code>.</p>'
                );
            }

            res.statusCode = 404;
            return res.end('Not Found');
        } catch (error) {
            wLogger.warn(
                `Failed to process request for %${url}%:`,
                (error as Error).message
            );
            wLogger.debug(`Request error details for %${url}%:`, error);

            res.writeHead(404);
            return res.end((error as Error).message || '');
        }
    });
}
