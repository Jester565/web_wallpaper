import IpcHelper from "./ipcHelper"

export default {
    getThisDeviceID: async (userID) => {
        let machineID = await IpcHelper.invoke("get-machine-id", "machine-id");
        //Append userID to machineID so that multiple users can use same device
        let deviceID = userID + machineID;
        return deviceID;
    }
}