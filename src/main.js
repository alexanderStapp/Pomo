import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import * as sound from 'sound-play';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

let mainWindow = null;
let focusAudio = '';
let breakAudio = '';

const createWindow = () => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 256,
		height: 384,
		backgroundColor: '#fff',
		resizable: false,
		titleBarStyle: 'hidden',
		frame: false,
		thickFrame: false,
		maximizable: false,
		icon: path.join(__dirname, '../assets/icons/Pomo.ico'),
		webPreferences: {
			contextIsolation: true,
			enableRemoteModule: false,
			preload: path.join(__dirname, 'preload.js')
		}
	});

	// and load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
		// Open the DevTools.
		mainWindow.webContents.openDevTools();
		mainWindow.resizable = true;
		focusAudio = path.join(__dirname, '../../assets/audio/start-focus.mp3');
		breakAudio = path.join(__dirname, '../../assets/audio/break.mp3');
	} else {
		mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
		focusAudio = path.join(process.resourcesPath, '/audio/start-focus.mp3');
		breakAudio = path.join(process.resourcesPath, '/audio/break.mp3');
	}

	app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
};

ipcMain.on('TITLE_BAR_ACTION', (event, args) => {
	if (mainWindow) {
		if (args === 'MINIMIZE_WINDOW') {
			mainWindow.minimize();
		} else if (args === 'CLOSE_APP') {
			mainWindow.close();
		} else if (args === 'PIN_WINDOW') {
			if (mainWindow.isAlwaysOnTop()) {
				mainWindow.setAlwaysOnTop(false);
				mainWindow.webContents.send('PIN_STATUS', false);
			} else {
				mainWindow.setAlwaysOnTop(true);
				mainWindow.webContents.send('PIN_STATUS', true);
			}
		}
	}
});

ipcMain.on('PLAY_SOUND', (event, args) => {
	if (args === 'FOCUS') {
		sound.play(focusAudio);
	} else if (args === 'BREAK') {
		sound.play(breakAudio);
	}
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow();

	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
