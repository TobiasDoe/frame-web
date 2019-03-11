import { app, BrowserWindow, webContents, ipcMain, session } from 'electron'
import { autoUpdater } from 'electron-updater';

// let ABPFilterParser = require('abp-filter-parser');
let fs = require('fs');
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

let mainWindow;
let browserOptions = {
	width: 1664,
	height: 1040,
	minWidth: 500,
	minHeight: 520,
	// frame: false,
	show: false,
	useContentSize: true,
	// backgroundColor: '#1D8FE1',
	titleBarStyle: 'hidden',
	title: 'frame',
	// scrollBounce: true
	vibrancy: 'appearance-based'
	// vibrancy: 'ultra-dark'
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
	browserOptions.webPreferences = { webSecurity: false };
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
		let check_block_list = /\.(gr|hk||fm|eu|it|es|is|net|ke|me||tz|za|zm|uk|us|in|com|de|fr|zw|tv|sk|se|php|pk|pl)\/ads?[\-_./\?]|(stats?|rankings?|tracks?|trigg|webtrends?|webtrekk|statistiche|visibl|searchenginejournal|visit|webstat|survey|spring).*.(com|net|de|fr|co|it|se)|cloudflare|\/statistics\/|torrent|[\-_./]ga[\-_./]|[\-_./]counter[\-_./\?]|ad\.admitad\.|\/widgets?[\-_./]?ads?|\/videos?[\-_./]?ads?|\/valueclick|userad|track[\-_./]?ads?|\/top[\-_./]?ads?|\/sponsor[\-_./]?ads?|smartadserver|\/sidebar[\-_]?ads?|popunder|\/includes\/ads?|\/iframe[-_]?ads?|\/header[-_]?ads?|\/framead|\/get[-_]?ads?|\/files\/ad*|exoclick|displayad|\ajax\/ad|adzone|\/assets\/ad*|advertisement|\/adv\/*\.|ad-frame|\.com\/bads\/|follow-us|connect-|-social-|googleplus.|linkedin|footer-social.|social-media|gmail|commission|adserv\.|omniture|huffingtonpost|dlpageping|log204|geoip\.|baidu|reporting\.|paypal|maxmind|geo\.|api\.bit|hits|predict|cdn-cgi|record_|\.ve$|radar|\.pop|\.tinybar\.|\.ranking|.cash|\.banner\.|adzerk|gweb|alliance|adf\.ly|monitor|urchin_post|imrworldwide|gen204|twitter|naukri|hulu.com|baidu|seotools|roi-|revenue|tracking.js|\/tracking[\-_./]?|elitics|demandmedia|bizrate|click-|click\.|bidsystem|affiliates?\.|beacon|hit\.|googleadservices|metrix|googleanal|dailymotion|ga.js|survey|trekk|visit_|arcadebanners?|visitor\.|ielsen|cts\.|link_|ga-track|FacebookTracking|quantc|traffic|evenuescien|roitra|pixelt|pagetra|metrics|[-_/.]?stats?[.-_/]?|common_|accounts\.|contentad|iqadtile|boxad|audsci.js|ebtrekk|seotrack|clickalyzer|\/tracker\/|ekomi|clicky|[-_/.]?click?[.-_/]?|[-_/.]?tracking?[.-_/]?|[-_/.]?track?[.-_/]?|ghostery|hscrm|watchvideo|clicks4ads|mkt[0-9]|createsend|analytix|shoppingshadow|clicktracks|admeld|google-analytics|-analytic|googletagservices|googletagmanager|tracking\.|thirdparty|track\.|pflexads|smaato|medialytics|doubleclick|cloudfront|sponsored-banner|sponsored_link|sponsored_ad|googleadword|analytics\.|googletakes|adsbygoogle|analytics-|-analytic|analytic-|googlesyndication|google_adsense2|googleAdIndexTop|\/ads\/|google-ad-|google-ad?|google-adsense-|google-adsense.|google-adverts-|google-adwords|google-afc-|google-afc.|google\/ad\?|google\/adv\.|google160.|google728.|_adv|google_afc.|google_afc_|google_afs.|google_afs_widget|google_caf.js|google_lander2.js|google_radlinks_|googlead|googleafc.|googleafs.|googleafvadrenderer.|googlecontextualads.|googleheadad.|googleleader.|googleleads.|googlempu.|ads_|_ads_|_ads|easyads|easyads|easyadstrack|ebayads|[.\-_/\?](ads?|clicks?|tracks?|tracking|logs?)[.\-_/]?(banners?|mid|trends|pathmedia|tech|units?|vert*|fox|area|loc|nxs|format|call|script|final|systems?|show|tag\.?|collect*|slot|right|space|taily|vids?|supply|true|targeting|counts?|nectar|net|onion|parlor|2srv|searcher|fundi|nimation|context|stats?|vertising|class|infuse|includes?|spacers?|code|images?|vers|texts?|work*|tail|track|streams?|ability||world*|zone|position|vertisers?|servers?|view|partner|data)[.\-_/]?/gi;
		let check_white_list = /facebook|github|youtube|netflix|seller|min.js|logos?|jquery|catalog|status|premoa.*.jpg|rakuten|nitori-net|search\?tbs\=sbi\:|google.*\/search|\/shopping\/product|aclk?|translate.googleapis.com|encrypted-|product|www.googleadservices.com\/pagead\/aclk|statue|target.com|.js|.png|.css|lib.js|tealeaf.js/gi;
		let block_me = check_block_list.test(test_url);
		let release_me = check_white_list.test(test_url);

		if (release_me) {
			callback({
				cancel: false
			})
		} else if (block_me) {
			console.log(details.url);
			callback({
				cancel: true
			});

		} else {
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
	});

	mainWindow.on('focus', function() {
		mainWindow.webContents.executeJavaScript(
			"$('body').removeClass('window_blured').addClass('window_focused');"
		);
	});

	mainWindow.on('leave-full-screen', function() {
		console.log('leave-full-screen');
		if(mainWindow != null && mainWindow.webContents != null) {
			mainWindow.webContents.send('leave-full-screen');
		}
	});

	mainWindow.on('swipe', (ev, direction) => {
		console.log('on swipe', direction);
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
