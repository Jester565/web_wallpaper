const { ipcRenderer } = require('electron');

export default {
    invoke: (channel, replyChannel, ...args) => {
        return new Promise((resolve) => {
            ipcRenderer.once(replyChannel, (__, resp) => {
                resolve(resp);
            });
            ipcRenderer.send(channel, ...args);
        });
    }
}