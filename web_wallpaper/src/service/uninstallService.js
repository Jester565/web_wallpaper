import NodeW from 'node-windows';
const Service = NodeW.Service;
import path from 'path';
const __dirname = path.resolve();

let svc = new Service({
    name: 'WebWall',
    description: 'Sets wallpaper on startup',
    script: __dirname + '/pullPaper.js',
    scriptOptions: '--experimental-modules'
});
svc.uninstall();
svc.on('uninstall', () => {
    console.log("Uninstalled");
});