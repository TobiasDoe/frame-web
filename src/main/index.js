import { app, BrowserWindow } from 'electron';

// const { appUpdater } = require('./autoupdater');

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
	useContentSize: true
	// vibrancy: 'light'
	// titleBarStyle: 'customButtonsOnHover'
	// icon: './resources/icons/appIcon.png',
};

const winURL = process.env.NODE_ENV === 'development' ?
	`http://localhost:9080` :
	`file://${__dirname}/index.html`;

function createWindow() {
	/**
	 * Initial window options
	 */

	Object.assign(browserOptions, config.get('winBounds'));
	mainWindow = new BrowserWindow(browserOptions);

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

	// autoUpdater.checkForUpdatesAndNotify();
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


// TODO: DO THIS!!!
/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater';

autoUpdater.on('update-downloaded', () => {
	autoUpdater.quitAndInstall();
});

app.on('ready', () => {
	if (process.env.NODE_ENV === 'production') {
		autoUpdater.checkForUpdates()
	}
});
*/
