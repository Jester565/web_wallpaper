const { ipcRenderer } = require('electron');
import { v4 as uuidv4 } from 'uuid'
let subTokens = {};

export default {
    invoke: (channel, replyChannel, ...args) => {
        return new Promise((resolve) => {
            ipcRenderer.once(replyChannel, (__, resp) => {
                resolve(resp);
            });
            ipcRenderer.send(channel, ...args);
        });
    },
    subscribe: (subChannel, cb, ...args) => {
        let subToken = uuidv4();
        subTokens[subToken] = {
            channel: subChannel,
            cb
        };
        ipcRenderer.on(subChannel, cb, args);
        return subToken;
    },
    unsubscribe: (subToken) => {
        let subInfo = subTokens[subToken];
        if (subInfo == null) {
            console.log("Invalid subtoken: ", subToken, " existing tokens: ", Object.keys(subTokens));
            return false;
        }
        ipcRenderer.removeListener(subInfo.channel, subInfo.cb);
        return true;
    }
}