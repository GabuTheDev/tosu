import {
    checkGameOverlayConfig,
    config,
    downloadFile,
    getProgramPath,
    unzip,
    wLogger
} from '@tosu/common';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { Process } from 'tsprocess/dist/process';

export const injectGameOverlay = async (p: Process) => {
    try {
        if (process.platform !== 'win32') {
            wLogger.error(
                '[ingame-overlay] Ingame overlay can run only under windows, sorry linux/darwin user!'
            );
            return;
        }

        checkGameOverlayConfig();

        const gameOverlayPath = path.join(getProgramPath(), 'game-overlay');
        if (!existsSync(gameOverlayPath)) {
            const archivePath = path.join(
                gameOverlayPath,
                'tosu-gameoverlay.zip'
            );

            await mkdir(gameOverlayPath);
            await downloadFile('https://tosu.app/overlay.zip', archivePath);

            await unzip(archivePath, gameOverlayPath);
            await rm(archivePath);
        }

        if (
            !existsSync(path.join(gameOverlayPath, 'tosu_overlay.dll')) &&
            !existsSync(path.join(gameOverlayPath, 'tosu_injector.exe'))
        ) {
            wLogger.error(
                '[ingame-overlay] Please delete game-overlay folder, and restart program!'
            );
            return;
        }

        return await new Promise((resolve, reject) => {
            const child = execFile(
                path.join(gameOverlayPath, 'tosu_injector.exe'),
                [
                    p.id.toString(),
                    config.serverIP,
                    config.serverPort.toString()
                ],
                {
                    cwd: gameOverlayPath,
                    windowsHide: true
                }
            );
            child.on('error', (err) => {
                reject(err);
            });
            child.on('exit', () => {
                wLogger.warn('[ingame-overlay] initialized successfully');
                resolve(true);
            });
        });
    } catch (exc) {
        wLogger.error('injectOverlay', (exc as any).message);
        wLogger.debug('injectOverlay', exc);
    }
};
