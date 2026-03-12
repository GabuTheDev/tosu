import { getStaticPath, wLogger, walkDirectory } from '@tosu/common';
import fs from 'fs';
import http from 'http';
import path from 'path';

import { getContentType } from '../index';
import { OVERLAYS_STATIC } from './homepage';

export function serveStatic({
    res,
    baseUrl,
    folderPath,
    pathname
}: {
    res: http.ServerResponse;
    baseUrl: string;
    pathname: string;
    folderPath: string;
}) {
    let cleanedUrl;
    try {
        cleanedUrl = decodeURIComponent(pathname);
    } catch {
        res.writeHead(404);
        res.end();
        return;
    }

    const filePath = path.join(folderPath, cleanedUrl);

    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }

    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
        if (!baseUrl.endsWith('/')) {
            res.writeHead(301, { Location: baseUrl + '/' });
            res.end();
            return;
        }

        const indexPath = path.join(filePath, 'index.html');
        if (fs.existsSync(indexPath)) {
            return serveFile(res, indexPath);
        }

        // TODO: Revisit directory listing feature and OVERLAYS_STATIC usage
        const entries = walkDirectory(filePath, { maxDepth: 0 });
        const htmlEntries = entries.map((entry) => {
            const isDir = entry.type === 'directory';
            const name = entry.name + (isDir ? '/' : '');
            return `<li><a href="${baseUrl}${encodeURIComponent(entry.name)}${isDir ? '/' : ''}">${name}</a></li>`;
        });

        const html = OVERLAYS_STATIC.replace(
            '{OVERLAYS_LIST}',
            htmlEntries.join('\n')
        ).replace('{PAGE_URL}', `tosu - ${baseUrl}`);

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    }

    return serveFile(res, filePath);
}

function serveFile(res: http.ServerResponse, filePath: string) {
    const contentType = getContentType(filePath);
    const isHTML = filePath.endsWith('.html');

    if (isHTML) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = addCounterMetadata(content, filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    } else {
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    }
}

export function addCounterMetadata(html: string, filePath: string) {
    try {
        const staticPath = getStaticPath();
        const counterPath = path
            .dirname(filePath.replace(staticPath, ''))
            .replace(/^(\\\\\\|\\\\|\\|\/|\/\/)/, '')
            .replace(/\\/gm, '/');

        return (
            html +
            `\n\n\n<script>\rwindow.COUNTER_PATH=\`${counterPath}\`\r</script>\n`
        );
    } catch (error) {
        wLogger.error(
            'Failed to add counter metadata:',
            (error as any).message
        );
        return html;
    }
}
