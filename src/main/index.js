// import { app, BrowserWindow, webContents, ipcMain, session } from 'electron'
import { app, BrowserWindow, ipcMain, session, systemPreferences } from 'electron'
import { autoUpdater } from 'electron-updater';

// let ABPFilterParser = require('abp-filter-parser');
// let fs = require('fs');
// const electronAdBlocker = require("electron-ad-blocker");
require('electron-dl')();

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

let vibrancy = systemPreferences.isDarkMode() ? 'ultra-dark' : 'medium-light';

let mainWindow;
let browserOptions = {
	width: 1490,
	height: 1010,
	minWidth: 500,
	minHeight: 520,
	webPreferences: {
		nodeIntegration: true,
		webviewTag: true
	},
	// frame: false,
	show: false,
	useContentSize: true,
	// backgroundColor: '#1D8FE1',
	titleBarStyle: 'hidden',
	title: 'frame',
	// scrollBounce: true
	// vibrancy: 'appearance-based'
	// vibrancy: 'ultra-dark'
	vibrancy: vibrancy
	// icon: './build/icons/icon.icns'
};

// let tabBrowserOptions = {
// 	// width: 1664,
// 	// height: 1040,
// 	// minWidth: 500,
// 	// minHeight: 520,
// 	frame: false,
// 	show: true,
// 	transparent: true
// 	// useContentSize: true,
// 	// // backgroundColor: '#1D8FE1',
// 	// titleBarStyle: 'hidden',
// 	// title: 'frame',
// 	// // scrollBounce: true
// 	// // vibrancy: 'appearance-based'
// 	// // vibrancy: 'ultra-dark'
// 	// // icon: './build/icons/icon.icns'
// };

const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`;
if(process.env.NODE_ENV === 'development') {
	browserOptions.webPreferences = { webSecurity: false, nodeIntegration: true, webviewTag: true };
}

function createWindow () {
	/**
	 * Initial window options
	 */
	Object.assign(browserOptions, config.get('winBounds'));
	mainWindow = new BrowserWindow(browserOptions);

	// Object.assign(tabBrowserOptions, { x: 0, y: 0, parent: mainWindow, show: true });
	// let tabWindow = new BrowserWindow(tabBrowserOptions);
	// electronAdBlocker.blockWindowAds(mainWindow);

	mainWindow.loadURL(winURL)
	// tabWindow.loadURL(winURL)

	// let easyListTxt = fs.readFileSync('easylist.txt', 'utf-8');

	session.defaultSession.webRequest.onBeforeRequest(['*://*./*'], function(details, callback) {

		let test_url = details.url;
		let check_block_list = /\bads\b|2o7|a1\.yimg|ad(brite|click|farm|revolver|server|tech|vert)|at(dmt|wola)|banner|bizrate|blogads|bluestreak|burstnet|casalemedia|coremetrics|(double|fast)click|falkag|(feedster|right)media|googlesyndication|hitbox|httpads|imiclk|intellitxt|js\.overture|kanoodle|kontera|mediaplex|nextag|pointroll|qksrv|speedera|statcounter|tribalfusion|webtrends/
		let more_check_block_list = /^(.+[-_.])??adse?rv(er?|ice)?s?[0-9]*[-.]|^(.+[-_.])??m?ad[sxv]?[0-9]*[-_.]|^(.+[-_.])??xn--|^adim(age|g)s?[0-9]*[-_.]|^adtrack(er|ing)?[0-9]*[-.]|^advert(s|is(ing|ements?))?[0-9]*[-_.]|^aff(iliat(es?|ion))?[-.]|^analytics?[-.]|^banners?[-.]|^beacons?[0-9]*[-.]|^count(ers?)?[0-9]*[-.]|^pixels?[-.]|^stat(s|istics)?[0-9]*[-.]|^telemetry[-.]|^track(ers?|ing)?[0-9]*[-.]|^traff(ic)?[-.]/
		let check_white_list = /seller|min.js|logos?|jquery|catalog|status|premoa.*.jpg|rakuten|nitori-net|search\?tbs\=sbi\:|google.*\/search|\/shopping\/product|aclk?|translate.googleapis.com|encrypted-|product|www.googleadservices.com\/pagead\/aclk|statue|target.com|.css|lib.js|tealeaf.js/gi;
		let block_me = check_block_list.test(test_url);
		let more_block_me = more_check_block_list.test(test_url);
		let release_me = check_white_list.test(test_url);

		if (release_me) {
			// console.log("white_listed!", details.url);
			callback({
				cancel: false
			})
		} else if (block_me || more_block_me) {
			// console.log("black_listed!", details.url);
			callback({
				cancel: true
			});

		} else {
			// console.log("not_black/white_listed!", details.url);
			callback({
				cancel: false
			})
		}

	});

	mainWindow.once('ready-to-show', mainWindow.show);

	mainWindow.on('close', () => {
		if(!mainWindow.isFullScreen()) {
			config.set('winBounds', mainWindow.getBounds());
		}
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
		mainWindow.webContents.send('window-lost-focus');
	});

	mainWindow.on('focus', function() {
		mainWindow.webContents.executeJavaScript(
			"$('body').removeClass('window_blured').addClass('window_focused');"
		);
		mainWindow.webContents.send('window-got-focus');
	});

	mainWindow.on('leave-full-screen', function() {
		// console.log('leave-full-screen');
		if(mainWindow != null && mainWindow.webContents != null) {
			mainWindow.webContents.send('leave-full-screen');
		}
	});

	mainWindow.on('swipe', (ev, direction) => {
		// console.log('on swipe', direction);
		if(mainWindow != null && mainWindow.webContents != null) {
			mainWindow.webContents.send('swipe', direction);
		}
	});
	mainWindow.on('scroll-touch-begin', function(event) {
		// console.log('on scroll-touch-begin', event);
		// console.log('on scroll-touch-begin');
		if(mainWindow != null && mainWindow.webContents != null) {
			mainWindow.webContents.send('scroll-touch-begin', event);
		}
	});
	mainWindow.on('scroll-touch-end', function(event) {
		// console.log('on scroll-touch-end', event);
		// console.log('on scroll-touch-end');
		if(mainWindow != null && mainWindow.webContents != null) {
			mainWindow.webContents.send('scroll-touch-end', event);
		}
	});
	mainWindow.on('scroll-touch-edge', function(event) {
		// console.log('on scroll-touch-edge', event);
		// console.log('on scroll-touch-edge');
		if(mainWindow != null && mainWindow.webContents != null) {
			mainWindow.webContents.send('scroll-touch-edge', event);
		}
	});
}

app.on('ready', createWindow);
app.once('ready', () => {
	if (process.env.NODE_ENV === 'development') {
		autoUpdater.updateConfigPath = path.join(`${__dirname}`, 'dev-app-update.yml');
		setTimeout(function () {
			autoUpdater.checkForUpdates();
		}, 1000);
	} else  if (process.env.NODE_ENV === 'production') {
		setTimeout(function () {
			autoUpdater.checkForUpdates();
		}, 1000);
	}
});

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

console.log("node version", process.versions.node);
// Auto Updater Events

autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";

autoUpdater.on('checking-for-update', () => {
	console.log('Checking for update...');
	if(mainWindow != null && mainWindow.webContents != null) {
		mainWindow.webContents.send('checking-for-update');
	}
});
autoUpdater.on('update-available', (ev) => {
	console.log('Update available.');
	if(mainWindow != null && mainWindow.webContents != null) {
		mainWindow.webContents.send('update-available', ev);
	}
});
autoUpdater.on('update-not-available', (ev) => {
	console.log('Update not available.');
	if(mainWindow != null && mainWindow.webContents != null) {
		mainWindow.webContents.send('update-not-available', ev);
	}
});
autoUpdater.on('error', (ev, err) => {
	console.log('There was a problem updating the application.');
	if(mainWindow != null && mainWindow.webContents != null) {
		mainWindow.webContents.send('update-error', ev, err);
	}
});
autoUpdater.on('download-progress', (ev, progressObj) => {
	console.log('Downloading update...', progressObj);
	if(mainWindow != null && mainWindow.webContents != null) {
		mainWindow.webContents.send('download-progress', ev, progressObj);
	}
});
autoUpdater.on('update-downloaded', (ev, releaseNotes, releaseName) => {
	console.log('Update downloaded.');
	if(mainWindow != null && mainWindow.webContents != null) {
		mainWindow.webContents.send('update-downloaded', ev, releaseNotes, releaseName);
	}
});

ipcMain.on('request-quit-and-install', () => {
	// Wait .5 seconds, then quit and install
	setTimeout(function () {
		if (process.env.NODE_ENV === 'production') {
			autoUpdater.quitAndInstall();
		}
	}, 500);
});

ipcMain.on('request-checking-for-update', () => {
	console.log('request-checking-for-update');
	if (process.env.NODE_ENV === 'development') {
		autoUpdater.updateConfigPath = path.join(`${__dirname}`, 'dev-app-update.yml');
		autoUpdater.checkForUpdates();
	} else if (process.env.NODE_ENV === 'production') {
		autoUpdater.checkForUpdates();
	}
});
