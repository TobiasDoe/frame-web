<template lang="html">
<div id="main_container" class="main_frame position-ref" >
	<div class="fullscreen web_content" id="web_content">
		<!-- <webview class="full-height" :src="config.currentUrl" autosize></webview> -->
	</div>
	<div class="progress_bar" id="progress_bar">
		<span id="progress_meter"></span>
	</div>
	<web-controls :globalMethods="globalMethods" :config="config" v-if="config.webControlsOpen"></web-controls>
</div>
</template>

<script>
import WebControls from './UI/WebControls';

console.log('test');
const electron = require('electron');
const remote = electron.remote;
const {
	app,
	Menu
} = remote;

let body = null;
let webview = null;
// let webViews = [];
let webViewIdCount = -1;
// let currentWebViewIndex = null;

let progressBar = null;
let progressMeter = null;

export default {
	name: 'browser',
	components: { WebControls },
	data: function() {
		let self = this;
		return {
			config: {
				homepage: "https://www.github.com",
				currentUrl: "https://www.github.com",
				currentTitle: "",
				requestUrl: "https://www.github.com",
				webControlsOpen: false,
				webViews: [],
				currentWebViewIndex: null
			},
			globalMethods: {
				toggleWebControls: function() {
					if(self.config.webControlsOpen) {
						self.globalMethods.closeWebControls();
					} else {
						self.globalMethods.openWebControls();
					}
				},
				openWebControls: function() {
					self.config.webControlsOpen = true;
					body.addClass('modal_open');
					body.addClass('web_controls_presented');
					// $('#tb_url').focus();
					// wv.requestSearchSuggestions(urlBar.value);
				},
				closeWebControls: function() {
					self.config.webControlsOpen = false;
					body.removeClass('modal_open');
					body.removeClass('web_controls_presented');
					// $('#tb_url').blur();
				},
				initNewWebView: function(target) {
					let newWebView = $('<webview class="full-height" autosize></webview>');
					let src = target != null ? target.url : 'file://';//self.config.homepage;
					newWebView.attr("src", src);
					webViewIdCount++;
					newWebView.attr("id", "webview_" + webViewIdCount);
					newWebView.attr("wv_index", webViewIdCount);
					$("#web_content").append(newWebView);
					let currentWV = document.querySelector("#webview_" + webViewIdCount);
					self.globalMethods.registerWebViewEventListeners(currentWV);
					self.config.webViews.push({
						index: webViewIdCount,
						webview: currentWV,
						title: 'New Web Site',
						icon: null
					});
					if (target == null ||  (target != null && target.disposition !== "background-tab")) {
						self.globalMethods.presentTabByIndex(webViewIdCount);
						webview = currentWV;
					}
					if (target == null) {
						if (self.config.webViews.length > 1) {
							self.globalMethods.openWebControls();
							$('#tb_url').focus();
							$('#tb_url').select();
						}
					}
					// remote.BrowserObservables.openTabs(self.config.webViews);
					self.globalMethods.doLayout();
				},
				handleNewWindowCall: function(e) {
					const protocol = require('url').parse(e.url).protocol
					if (protocol === 'http:' || protocol === 'https:') {
						self.globalMethods.initNewWebView(e);
					}
				},
				registerWebViewEventListeners: function(regView) {
					regView.addEventListener('load-commit', self.globalMethods.webviewHandler.handleNavigation);
					regView.addEventListener('did-start-loading', self.globalMethods.webviewHandler.handleLoadStart);
					regView.addEventListener('did-finish-load', self.globalMethods.webviewHandler.handleLoadCommit);
					regView.addEventListener('did-stop-loading', self.globalMethods.webviewHandler.handleLoadStop);
					regView.addEventListener('new-window', self.globalMethods.handleNewWindowCall);
					regView.addEventListener('page-title-updated', self.globalMethods.webviewHandler.handlePageTitle);
					regView.addEventListener('page-favicon-updated', self.globalMethods.webviewHandler.handleFavIcon);


					// regView.addEventListener('close', handleExit);
					// regView.addEventListener('did-fail-load', handleLoadAbort);
					// regView.addEventListener('did-get-redirect-request', handleLoadRedirect);
				},
				webviewHandler: {
					handleNavigation: function(event) {
						// TODO: make urlbar logic useable again!
						// urlBar['focus-value'] = event.url;
						// urlBar['blur-value'] = event.url;
						// if (urlBar !== document.activeElement) {
						// 	urlBar.value = event.url;
						// }
					},
					handleLoadStart: function(event) {
						progressBar.style.transition = 'opacity 0s';
						progressBar.style['transition-delay'] = '0s';
						progressBar.style.opacity = 1;
						progressMeter.style.width = '10%';
						progressMeter.style.transition = '.2s';
						setTimeout(function() {
							progressMeter.style.width = '80%';
							progressMeter.style.transition = '3s';
						}, 200);
					},
					handleLoadCommit: function(event) {
						console.log("handleLoadCommit", event);
					},
					handleLoadStop: function() {
						// urlBar['focus-value'] = webview.getURL();
						// urlBar['blur-value'] = wv.getRootURL(webview.getURL()) + " - " + webview.getTitle();
						// if (urlBar !== document.activeElement) {
						// 	urlBar.value = urlBar['blur-value'];
						// }
						progressMeter.style.width = '100%';
						progressMeter.style.transition = '.2s';
						progressBar.style.transition = 'opacity .3s';
						progressBar.style['transition-delay'] = '.5s';
						progressBar.style.opacity = 0;
						setTimeout(function() {
							progressMeter.style.width = '0px';
						}, 700);
					},
					handlePageTitle: function(event) {
						console.log("handlePageTitle", event);
						let wvIndex = $('#' + event.target.id).attr('wv_index');
						self.config.webViews[wvIndex].title = event.title;
						console.log(self.config.webViews);
					},
					handleFavIcon: function(event) {
						console.log("handleFavIcon", event);
						let wvIndex = $('#' + event.target.id).attr('wv_index');
						self.config.webViews[wvIndex].icon = event.favicons[0];
					}
				},
				presentTabByIndex: function(tabIndex) {
					for(let wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
						let currWebView = self.config.webViews[wvIndex];
						if(currWebView.index !== tabIndex) {
							$(currWebView.webview).hide();
							$(currWebView.webview).attr("active", false);
						} else {
							$(currWebView.webview).show();
							$(currWebView.webview).attr("active", true);
							self.config.currentWebViewIndex = currWebView.index;
							webview = currWebView.webview;
						}
					}
					self.globalMethods.doLayout();
					// console.log(self.config.currentWebViewIndex);
				},
				closeTabByIndex: function(tabIndex) {
					let wvIndex;
					let currWebView = null;
					for(wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
						currWebView = self.config.webViews[wvIndex];
						if(currWebView.index === tabIndex) {
							break;
						}
					}
					if(currWebView != null) {
						self.globalMethods.presentTabByIndex(self.globalMethods.findPrevTabIndex());
						currWebView.webview.remove();
						self.config.webViews.splice(wvIndex, 1);
					}
					// remote.BrowserObservables.openTabs(self.config.webViews);
				},
				findNextTabIndex: function() {
					let foundWv = false;
					let wvLoaded = false;
					let tabIndex = null;
					for (let wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
						let currWebView = self.config.webViews[wvIndex];
						if(currWebView.index === self.config.currentWebViewIndex) {
							foundWv = true;
						} else if (foundWv === true) {
							wvLoaded = true;
							tabIndex = currWebView.index;
							break;
						}
					}
					if(wvLoaded === false) {
						tabIndex = self.config.webViews[0].index;
					}
					return tabIndex;
				},
				findPrevTabIndex: function() {
					let tabIndex = null;
					let lastWv = null;
					for (let wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
						let currWebView = self.config.webViews[wvIndex];
						if(currWebView.index === self.config.currentWebViewIndex) {
							if(lastWv != null) {
								tabIndex = lastWv.index;
							}else{
								tabIndex = self.globalMethods.findNextTabIndex();
							}
							break;
						}
						lastWv = currWebView;
					}
					return tabIndex;
				},
				navigateTo: function(url) {
					// resetExitedState();
					webview.loadURL(url);
					self.config.currentUrl = url;
					self.config.requestUrl = url;
					self.globalMethods.closeWebControls();
				},
				submitRequestUrl: function() {
					console.log('submitRequestUrl');
					let requestURL = self.config.requestUrl.trim();
					if (requestURL.indexOf('.') !== -1) {
						let httpFound = requestURL.indexOf('http://') !== -1 ? true : requestURL.indexOf('https://') !== -1 ? true : false;
						if (!httpFound && requestURL.indexOf('file://') === -1) {
							requestURL = "http://" + requestURL;
						}
					} else {
						requestURL = "https://www.google.at/search?q=" + encodeURI(requestURL);
					}
					self.globalMethods.navigateTo(requestURL);
					// urlBar.blur();
				},
				requestSearchSuggestions: function(query, querySelect) {
					console.log('requestSearchSuggestions');
					// let suggestions = null;
					//
					// let xmlhttp = new XMLHttpRequest();
					//
					// xmlhttp.onreadystatechange = function() {
					// 	if (xmlhttp.readyState === XMLHttpRequest.DONE) {
					// 		if (xmlhttp.status === 200) {
					// 			wv.showSuggestions(xmlhttp.responseText, querySelect);
					// 		} else if (xmlhttp.status === 400) {
					// 			console.warn('There was an error 400');
					// 		} else {
					// 			console.warn('something else other than 200 was returned');
					// 		}
					// 	}
					// };
					// let searchQuery = "https://suggestqueries.google.com/complete/search?client=chrome&q=" + query;
					// xmlhttp.open("GET", searchQuery, true);
					// xmlhttp.send();
				},
				doLayout: function() {
					// let titleBar = document.querySelector('#electron_titlebar');
					// let fullscreenContent = $('.fullscreen');
					// let webViewBlocks = $(".webview");
					// let titleBarHeight = titleBar.offsetHeight;
					let windowWidth = document.documentElement.clientWidth;
					let windowHeight = document.documentElement.clientHeight;
					let mainWidth = windowWidth;
					let mainHeight = windowHeight;
					// let mainHeight = windowHeight - titleBarHeight;

					// webViewBlocks.width(mainWidth);
					// webViewBlocks.height(mainHeight);
					//
					progressBar.style.width = mainWidth + 'px';
					// let wc = webview.getWebContents();
					// if(wc != null) {
					// 	wc.setSize({
					// 		normal: {
					// 			width: mainWidth,
					// 			height: mainHeight
					// 		}
					// 	});
					// }
				}
			}
		};
	},
	mounted: function() {
		let self = this;
		body = $('body');

		progressBar = document.querySelector('#progress_bar');
		progressMeter = document.querySelector('#progress_meter');

		if(webview === null) {
			self.globalMethods.initNewWebView();
			self.globalMethods.openWebControls();
		}

		window.onresize = self.globalMethods.doLayout;

// -----------------------------------------------------------
// -----------------------MenuItemCalls-----------------------
// -----------------------------------------------------------
		function menuItemCall(call) {
			switch (call) {
				case 'openWebControls':
					self.globalMethods.toggleWebControls();
					// self.globalMethods.openWebControls();
					break;
				case 'closeWebControls':
					self.globalMethods.closeWebControls();
					// $("#web_content").removeClass('expose');
					break;
				case 'reloadSite':
					webview.reload();
					break;
				case 'goBack':
					if (webview.canGoBack()) {
						webview.goBack();
					}
					break;
				case 'goForward':
					if (webview.canGoForward()) {
						webview.goForward();
					}
					break;
				case 'quitApp':
					console.log(remote);
					const window = remote.getCurrentWindow();
					window.close();
					break;
				case 'newTab':
					self.globalMethods.initNewWebView();
					break;
				case 'nextTab':
					self.globalMethods.presentTabByIndex(self.globalMethods.findNextTabIndex());
					break;
				case 'closeTab':
					// menuItemCall("quitApp");
					if(self.config.webViews.length > 1){
						self.globalMethods.closeTabByIndex(self.config.currentWebViewIndex);
					} else {
						menuItemCall("quitApp");
					}
					break;
				case 'tabExpose':
					// $("#web_content").addClass('expose');
					break;
				default:
			}
		}

		// MENUTEMPLATE
		const template = [{
				label: 'File',
				submenu: [{
						label: 'New Tab',
						accelerator: 'CmdOrCtrl+T',
						role: 'newTab',
						click: function(menuItem, currentWindow) {
							menuItemCall('newTab');
						}
					},
					{
						label: 'Open Tab Exposé',
						accelerator: 'CmdOrCtrl+E',
						role: 'tabExpose',
						click: function(menuItem, currentWindow) {
							menuItemCall('tabExpose');
						}
					},
					{
						label: 'Next Tab',
						accelerator: 'Ctrl+tab',
						role: 'nextTab',
						click: function(menuItem, currentWindow) {
							menuItemCall('nextTab');
						}
					},
					{
						label: 'Close Tab',
						accelerator: 'CmdOrCtrl+W',
						role: 'closeTab',
						click: function(menuItem, currentWindow) {
							menuItemCall('closeTab');
						}
					},
					{
						label: 'Open Web Controls...',
						accelerator: 'CmdOrCtrl+L',
						role: 'openWebControls',
						click: function(menuItem, currentWindow) {
							menuItemCall('openWebControls');
						}
					},
					{
						label: 'Close Web Controls...',
						accelerator: 'esc',
						role: 'closeWebControls',
						click: function(menuItem, currentWindow) {
							menuItemCall('closeWebControls');
						}
					},
					{
						type: 'separator'
					},
					{
						label: 'Quit App',
						accelerator: 'CmdOrCtrl+Q',
						role: 'quitApp',
						click: function(menuItem, currentWindow) {
							menuItemCall('quitApp');
						}
					}
				]
			},
			{
				label: 'Edit',
				submenu: [{
						role: 'undo'
					},
					{
						role: 'redo'
					},
					{
						type: 'separator'
					},
					{
						role: 'cut'
					},
					{
						role: 'copy'
					},
					{
						role: 'paste'
					},
					{
						role: 'pasteandmatchstyle'
					},
					{
						role: 'delete'
					},
					{
						role: 'selectall'
					}
				]
			},
			{
				label: 'View',
				submenu: [{
						label: 'Reload Page',
						accelerator: 'CmdOrCtrl+R',
						role: 'reloadSite',
						click: function(menuItem, currentWindow) {
							menuItemCall('reloadSite');
						}
					},
					{
						type: 'separator'
					},
					{
						label: 'Go Back',
						accelerator: 'CmdOrCtrl+Left',
						role: 'goBack',
						click: function(menuItem, currentWindow) {
							menuItemCall('goBack');
						}
					},
					{
						label: 'Go Forward',
						accelerator: 'CmdOrCtrl+Right',
						role: 'goForward',
						click: function(menuItem, currentWindow) {
							menuItemCall('goForward');
						}
					},
					{
						role: 'forcereload'
					},
					{
						role: 'toggledevtools'
					},
					{
						type: 'separator'
					},
					{
						role: 'resetzoom'
					},
					{
						role: 'zoomin'
					},
					{
						role: 'zoomout'
					},
					{
						type: 'separator'
					},
					{
						role: 'togglefullscreen'
					}
				]
			},
			{
				role: 'window',
				submenu: [{
						role: 'minimize'
					}
				]
			},
			{
				role: 'help',
				submenu: [{
					label: 'Learn More',
					click() {
						require('electron').shell.openExternal('http://onmyown.at/');
					}
				}]
			}
		];

		if (process.platform === 'darwin') {
			template.unshift({
				label: app.getName(),
				submenu: [{
						role: 'about'
					},
					{
						type: 'separator'
					},
					{
						role: 'services',
						submenu: []
					},
					{
						type: 'separator'
					},
					{
						role: 'hide'
					},
					{
						role: 'hideothers'
					},
					{
						role: 'unhide'
					},
					{
						type: 'separator'
					},
					{
						role: 'quit'
					}
				]
			});
			// Edit menu.
			template[2].submenu.push({
				type: 'separator'
			}, {
				label: 'Speech',
				submenu: [{
						role: 'startspeaking'
					},
					{
						role: 'stopspeaking'
					}
				]
			});
			// Window menu.
			template[4].submenu = [{
					label: 'Minimize',
					accelerator: 'CmdOrCtrl+M',
					role: 'minimize'
				},
				{
					label: 'Zoom',
					role: 'zoom'
				},
				{
					type: 'separator'
				},
				{
					label: 'Bring All to Front',
					role: 'front'
				}
			];
		}

		let menu = menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	},
	methods: {
		open(link) {
			this.$electron.shell.openExternal(link)
		}
	}
}
</script>

<style lang="scss">
#progress_bar {
	position: absolute;
	display: block;
	width: 99.85%;
	height: 2px;
	left: 0;
	top: 0;
	overflow: hidden;
	z-index: 200;
	// border-bottom: 0px;
	// border-bottom-left-radius: 35px;
	// border-bottom-right-radius: 35px;

	#progress_meter {
		display: block;
		width: 0px;
		height: 2px;
		background: #fb8800;
		transition: width 10s ease-in-out;
	}
}
</style>
