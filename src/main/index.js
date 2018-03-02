import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

const electronAdBlocker = require("electron-ad-blocker");

const path = require('path');

const Config = require('electron-config');
const config = new Config();

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
	global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow;
let browserOptions = {
	width: 1664,
	height: 1040,
	minWidth: 400,
	minHeight: 250,
	frame: false,
	show: false,
	useContentSize: true,
	backgroundColor: '#1D8FE1',
	titleBarStyle: 'hidden',
	title: 'frame'
	// vibrancy: 'dark'
	// icon: './build/icons/icon.icns'
};

const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`;
if(process.env.NODE_ENV === 'development') {
	browserOptions.webPreferences = { webSecurity: false };
}

function createWindow() {
	/**
	 * Initial window options
	 */

	Object.assign(browserOptions, config.get('winBounds'));
	mainWindow = new BrowserWindow(browserOptions);

	electronAdBlocker.blockWindowAds(mainWindow);

	mainWindow.loadURL(winURL);

	mainWindow.once('ready-to-show', mainWindow.show);

	mainWindow.on('close', () => {
		config.set('winBounds', mainWindow.getBounds());
	})

	mainWindow.on('closed', () => {
		mainWindow = null
	})

	mainWindow.on('resize', function() {
	});

	mainWindow.on('blur', function() {
		mainWindow.webContents.executeJavaScript(
			"$('body').removeClass('window_focused').addClass('window_blured');" +
			"$('#tb_url').focus();"
		);
	});

	mainWindow.on('focus', function() {
		mainWindow.webContents.executeJavaScript(
			"$('body').removeClass('window_blured').addClass('window_focused');"
		);
	});

	// Wait a second for the window to exist before checking for updates.
	// if(process.env.NODE_ENV === 'development') {
	// 	autoUpdater.updateConfigPath = path.join(`${__dirname}`, 'dev-app-update.yml');
	// 	setTimeout(function () {
	// 		autoUpdater.checkForUpdates();
	// 	}, 1000);
	// }
	if (process.env.NODE_ENV === 'production') {
		setTimeout(function () {
			autoUpdater.checkForUpdates();
		}, 1000);
	}
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow()
	}
});


// Auto Updater Events

autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";

autoUpdater.on('checking-for-update', () => {
	console.log('Checking for update...');
	mainWindow.webContents.send('checking-for-update');
});
autoUpdater.on('update-available', (ev) => {
	console.log('Update available.');
	mainWindow.webContents.send('update-available', ev);
});
autoUpdater.on('update-not-available', (ev) => {
	console.log('Update not available.');
	mainWindow.webContents.send('update-not-available', ev);
});
autoUpdater.on('error', (ev, err) => {
	console.log('Error in auto-updater.');
	mainWindow.webContents.send('update-error', ev, err);
});
autoUpdater.on('download-progress', (ev, progressObj) => {
	console.log('Downloading update...', progressObj);
	mainWindow.webContents.send('download-progress', ev, progressObj);
});
autoUpdater.on('update-downloaded', (ev) => {
	console.log('Update downloaded.');
	mainWindow.webContents.send('update-downloaded', ev);
});

ipcMain.on('request-quit-and-install', () => {
	// Wait 1 second, then quit and install
	setTimeout(function () {
		if (process.env.NODE_ENV === 'production') {
			autoUpdater.quitAndInstall();
		}
	}, 1000);
});
