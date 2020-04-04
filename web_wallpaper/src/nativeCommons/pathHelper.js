import path from 'path'

const ROOT_NAME = 'web_wallpaper';

export default {
    getDataDir: () => {
        let currentPath = path.resolve();
        let rootIdx = currentPath.lastIndexOf(ROOT_NAME);
        let dataPath = currentPath.substr(0, rootIdx + ROOT_NAME.length + 1) + "\\data";
        return dataPath;
    }
}