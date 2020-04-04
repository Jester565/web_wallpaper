import fs from 'fs'
import { promisify } from 'util'
import _ from 'lodash'
import PathHelper from './pathHelper.js'

const asyncWriteFile = promisify(fs.writeFile);
const asyncReadFile = promisify(fs.readFile);
const asyncFileExists = promisify(fs.exists);

const DATA_FILE = 'data.json';

let persistentData = {};

export default {
    initData: async () => {
        let dataDir = PathHelper.getDataDir();
        let dataPath = `${dataDir}/${DATA_FILE}`;
        if (await asyncFileExists(dataPath)) {
            persistentData = JSON.parse(await asyncReadFile(dataPath));
            return true;
        }
        return false;
    },
    getData: () => {
        return persistentData;
    },
    setData: async (data) => {
        let dataDir = PathHelper.getDataDir();
        _.merge(persistentData, data);
        await asyncWriteFile(`${dataDir}/${DATA_FILE}`, JSON.stringify(persistentData));
    }
}