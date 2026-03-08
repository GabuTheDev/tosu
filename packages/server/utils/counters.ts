import {
    JsonSafeParse,
    getStaticPath,
    recursiveFilesSearch
} from '@tosu/common';
import fs from 'fs';
import path from 'path';

import { ICounter, bodyPayload } from './counters.types';
import { parseCounterSettings } from './parseSettings';

function splitTextByIndex(text: string, letter: string) {
    const index = text.indexOf(letter);
    if (index === -1) {
        return [text];
    } else {
        const part1 = text.substring(0, index);
        const part2 = text.substring(index);

        return [part1, part2];
    }
}

export function parseTXT(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf8')?.split('\n');

    const object: any = {};
    for (let i = 0; i < content.length; i++) {
        const line = content[i];
        const result = splitTextByIndex(line, ':');
        let [key, value] = result;
        if (
            key === null ||
            value === null ||
            key === undefined ||
            value === undefined
        )
            continue;
        value = value.split('##')[0].replace(/\r/, '').replace(':', '');

        if (/[0-9 ]+x[ 0-9-]+/.test(value)) {
            object[key.toLowerCase()] = value.split(/x/i);
        } else object[key.toLowerCase()] = value.trim();
    }

    filePath = path.resolve(filePath);

    const staticPath = getStaticPath();
    object.folderName = path
        .dirname(filePath.replace(staticPath, ''))
        .replace(/^(\\\\\\|\\\\|\\|\/|\/\/)/, '')
        .replace(/\\/gm, '/');

    const settingsPath = path.join(
        staticPath,
        object.folderName,
        'settings.json'
    );
    const settings = fs.existsSync(settingsPath)
        ? JsonSafeParse({
              isFile: true,
              payload: settingsPath,
              defaultValue: []
          })
        : [];

    if (object.resolution)
        object.resolution = object.resolution.map((r: string) => +r.trim()) || [
            -1, -1
        ];
    else object.resolution = [-1, -1];

    if (object.authorlinks) object.authorlinks = object.authorlinks.split(',');
    if (!object.version) object.version = '1.0';

    object.settings = Array.isArray(settings) ? settings : [];

    delete object.compatiblewith;
    delete object.usecase;

    return object;
}

export function saveSettings(folderName: string, payload: bodyPayload[]) {
    const result = parseCounterSettings(
        folderName,
        'user/save',
        payload as any
    );
    if (result instanceof Error) {
        return result;
    }

    fs.writeFileSync(
        result.settingsValuesPath!,
        JSON.stringify(result.values),
        'utf8'
    );
    return true;
}

export function getLocalCounters(): ICounter[] {
    const staticPath = getStaticPath();

    const countersListTXT = recursiveFilesSearch({
        _ignoreFileName: 'ignore.txt',
        dir: staticPath,
        fileList: [],
        filename: 'metadata.txt'
    });

    const countersListHTML = recursiveFilesSearch({
        _ignoreFileName: 'ignore.txt',
        dir: staticPath,
        fileList: [],
        filename: 'index.html'
    });

    const arrayOfLocal = countersListHTML
        .filter((r) => {
            const folder = path.dirname(r);
            return (
                countersListTXT.find((s) => path.dirname(s) === folder) == null
            );
        })
        .map((r) => {
            const nestedFolderPath = path.dirname(r.replace(staticPath, ''));
            const folderName = nestedFolderPath
                .replace(/^(\\\\\\|\\\\|\\|\/|\/\/)/, '')
                .replace(/\\/gm, '/');

            const settingsPath = path.join(
                staticPath,
                folderName,
                'settings.json'
            );
            const settings = fs.existsSync(settingsPath)
                ? JsonSafeParse({
                      isFile: true,
                      payload: settingsPath,
                      defaultValue: []
                  })
                : [];

            return {
                folderName: nestedFolderPath
                    .replace(/^(\\\\\\|\\\\|\\|\/|\/\/)/, '')
                    .replace(/\\/gm, '/'),
                name: path.basename(path.dirname(r)),
                version: '1.0',
                author: 'local',
                resolution: [-2, 400],
                authorlinks: [],
                settings: Array.isArray(settings) ? settings : []
            } as ICounter;
        });

    const array = countersListTXT.map((r) => parseTXT(r));
    return array.concat(arrayOfLocal).filter((r) => r.name !== '');
}
