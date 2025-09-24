// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
	'electronAPI', {
		sendEvent: (channel, data) => {
			// whitelist channels
			const validChannels = ['toMain', 'TITLE_BAR_ACTION'];
			if (validChannels.includes(channel)) {
				ipcRenderer.send(channel, data);
			}
		},
		// receiveEvent: (channel, func) => {
		// 	const validChannels = ['fromMain', 'PIN_STATUS'];
		// 	console.log(channel, func);
		// 	if (validChannels.includes(channel)) {
		// 		// Deliberately strip event as it includes `sender`
		// 		ipcRenderer.on(channel, (event, ...args) => func(...args));
		// 	}
		// }
		receiveEvent: (callback) => {
			ipcRenderer.on('PIN_STATUS', (_event, value) => callback(value));
		}
	}
);