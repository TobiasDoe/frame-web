<template lang="html">
<div id="main_container" class="main_frame position-ref" >
	<div class="fullscreen web_content" id="web_content">
		<!-- <webview class="full-height" :src="config.currentUrl" autosize></webview> -->
	</div>
	<div class="progress_bar" id="progress_bar">
		<span id="progress_meter"></span>
	</div>
	<div id="main_notify_history">
	</div>
	<web-controls :globalMethods="globalMethods" :config="config" v-if="config.webControlsOpen"></web-controls>
</div>
</template>

<script>
import WebControls from './UI/WebControls';

// console.log('test');
const electron = require('electron');
const remote = electron.remote;
const {
	app,
	Menu
} = remote;

let body = null;
// let webview = null;
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
				webView: null,
				currentWebViewIndex: null,
				mainNotification: {
					count: -1,
					show: function(text) {
						this.count++;
						let rndClass = 'notify_id_' + this.count;
						let newMainNotify = $('<div class="main_notify show"></div>');
						newMainNotify.addClass(rndClass);
						let newMainNotifyInfo = $('<span class="main_notify_info">' + text + '</span>');
						newMainNotify.append(newMainNotifyInfo);
						$('#main_notify_history').append(newMainNotify);
						// $('#main_notify').attr('class', '').addClass('show').addClass(rndClass);
						setTimeout(function () {
							$('.main_notify.' + rndClass).remove();
						}, 3000);
					}
				},
				bookmarks: [
					{
						title: 'Apple',
						url: 'https://www.apple.com',
						icon: null
					},
					{
						title: 'Google',
						url: 'https://www.google.com/?gfe_rd=cr&gws_rd=cr',
						icon: null
					},
					{
						title: 'Youtube',
						url: 'https://www.youtube.com',
						icon: null
					},
					{
						title: 'Facebook',
						url: 'https://www.facebook.com',
						icon: null
					},
					{
						title: 'GitHub',
						url: 'https://www.github.com',
						icon: null
					}
				]
			},
			globalMethods: {
				toggleWebControls: function() {
					if(self.config.webControlsOpen && $("#tb_url:focus").length > 0) {
						self.globalMethods.closeWebControls();
					} else {
						self.globalMethods.openWebControls();
					}
				},
				openWebControls: function() {
					self.config.webControlsOpen = true;
					body.addClass('modal_open');
					body.addClass('web_controls_presented');
					$('#tb_url').focus();
					// wv.requestSearchSuggestions(urlBar.value);
				},
				closeWebControls: function() {
					self.config.webControlsOpen = false;
					body.removeClass('modal_open');
					body.removeClass('web_controls_presented');
					// $('#tb_url').blur();

					$(self.config.webView.webview).blur();
					$(self.config.webView.webview).focus();
				},
				initNewWebView: function(target) {
					let newWebView = $('<webview class="fresh_view" autosize webpreferences=""></webview>');
					let src = target != null ? target.url : 'file://'; // self.config.homepage;
					newWebView.attr("src", src);
					webViewIdCount++;
					newWebView.attr("id", "webview_" + webViewIdCount);
					newWebView.attr("wv_index", webViewIdCount);
					$("#web_content").append(newWebView);
					let currentWV = document.querySelector("#webview_" + webViewIdCount);
					self.globalMethods.registerWebViewEventListeners(currentWV);
					let webViewObject = {
						index: webViewIdCount,
						webview: currentWV,
						title: 'New Tab',
						url: "",
						icon: null // TODO: change temp settings to local files
					};
					self.config.webViews.push(webViewObject);
					if (target == null ||  (target != null && target.disposition !== "background-tab")) {
						self.globalMethods.presentTabByIndex(webViewIdCount);
						self.config.webView = webViewObject;
						$(self.config.webView.webview).addClass('active');
					}
					if (target == null) {
						if (self.config.webViews.length > 1) {
							self.globalMethods.openWebControls();
							$('#tb_url').focus();
							$('#tb_url').select();
						}
					}
					// remote.BrowserObservables.openTabs(self.config.webViews);
					// self.globalMethods.doLayout();
				},
				handleNewWindowCall: function(e) {
					const protocol = require('url').parse(e.url).protocol
					if (protocol === 'http:' || protocol === 'https:') {
						self.globalMethods.initNewWebView(e);
					}
				},
				registerWebViewEventListeners: function(regView) {
					regView.addEventListener('load-commit', self.globalMethods.webviewHandler.handleNavigation);
					regView.addEventListener('will-navigate', self.globalMethods.webviewHandler.handleWillNavigate);
					regView.addEventListener('did-start-loading', self.globalMethods.webviewHandler.handleLoadStart);
					regView.addEventListener('did-finish-load', self.globalMethods.webviewHandler.handleLoadFinish);
					regView.addEventListener('did-stop-loading', self.globalMethods.webviewHandler.handleLoadStop);
					regView.addEventListener('new-window', self.globalMethods.handleNewWindowCall);
					regView.addEventListener('page-title-updated', self.globalMethods.webviewHandler.handlePageTitle);
					regView.addEventListener('page-favicon-updated', self.globalMethods.webviewHandler.handleFavIcon);
					regView.addEventListener('did-change-theme-color', self.globalMethods.webviewHandler.handleThemeColor);
					// regView.addEventListener('close', handleExit);
					// regView.addEventListener('did-fail-load', handleLoadAbort);
					// regView.addEventListener('did-get-redirect-request', handleLoadRedirect);
				},
				webviewHandler: {
					handleNavigation: function(event) {
						console.log("handleNavigation", event);
						if(event.isMainFrame) {
							// TODO: thats not right? what if the tab finishes in the background?
							self.config.currentUrl = event.url;
							self.config.requestUrl = event.url;

							// self.config.mainNotification.show(event.url);

							let targetWvIndex = $(event.target).attr('wv_index');
							for (let wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
								if(self.config.webViews[wvIndex].index == targetWvIndex) {
									self.config.webViews[wvIndex].url = event.url;
									break;
								}
							}
						}
					},
					handleLoadStart: function(event) {
						// console.log("handleLoadStart", event);
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
					handleLoadFinish: function(event) {
						console.log("handleLoadFinish", event.target.src);
						$(event.target).removeClass('fresh_view');
					},
					handleLoadStop: function() {
						// urlBar['focus-value'] = webview.getURL();
						// urlBar['blur-value'] = wv.getRootURL(webview.getURL()) + " - " + webview.getTitle();
						// if (urlBar !== document.activeElement) {
						// 	urlBar.value = urlBar['blur-value'];
						// }
						progressMeter.style.width = '100vw';
						progressMeter.style.transition = '.2s';
						progressBar.style.transition = 'opacity .3s';
						progressBar.style['transition-delay'] = '.5s';
						progressBar.style.opacity = 0;
						setTimeout(function() {
							progressMeter.style.transition = '0s';
							progressMeter.style.width = '0px';
						}, 700);
					},
					handlePageTitle: function(event) {
						console.log("handlePageTitle", event);
						let targetWvIndex = $(event.target).attr('wv_index');
						for (let wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
							if(self.config.webViews[wvIndex].index == targetWvIndex) {
								self.config.webViews[wvIndex].title = event.title;
								// self.config.mainNotification.show(event.title);
								break;
							}
						}
					},
					handleFavIcon: function(event) {
						console.log("handleFavIcon", event);
						let targetWvIndex = $(event.target).attr('wv_index');
						for (let wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
							if(self.config.webViews[wvIndex].index == targetWvIndex) {
								self.config.webViews[wvIndex].icon = event.favicons[0];
								break;
							}
						}
					},
					handleThemeColor: function(event) {
						console.log("handleThemeColor", event);
						let targetWvIndex = $(event.target).attr('wv_index');
						for (let wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
							if(self.config.webViews[wvIndex].index == targetWvIndex) {
								// self.config.webViews[wvIndex].themeColor = event.favicons[0];
								break;
							}
						}
					},
					handleWillNavigate: function(event) {
						console.log("handleWillNavigate", event);
						// let targetWvIndex = $(event.target).attr('wv_index');
						// for (let wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
						// 	if(self.config.webViews[wvIndex].index == targetWvIndex) {
						// 		// self.config.webViews[wvIndex].url = event.favicons[0];
						// 		break;
						// 	}
						// }
					}
				},
				presentTabByIndex: function(tabIndex) {
					for(let wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
						let currWebView = self.config.webViews[wvIndex];
						if(currWebView.index !== tabIndex) {
							$(currWebView.webview).removeClass('active');
							$(currWebView.webview).attr("active", false);
						} else {
							$(currWebView.webview).addClass('active');
							self.config.mainNotification.show(currWebView.title);
							$(currWebView.webview).attr("active", true);
							self.config.currentWebViewIndex = tabIndex;
							self.config.webView = currWebView;
							if (self.config.webControlsOpen) {
								$('#tb_url').select();
							}
						}
					}
					// self.globalMethods.doLayout();
					// console.log(self.config.currentWebViewIndex);
				},
				closeTabByIndex: function(tabIndex) {
					let wvIndex;
					let currWebView = null;
					for(wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
						currWebView = self.config.webViews[wvIndex];
						if(currWebView.index === tabIndex) {
							self.globalMethods.presentTabByIndex(self.globalMethods.findPrevTabIndex());
							currWebView.webview.remove();
							self.config.webViews.splice(wvIndex, 1);
							break;
						}
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
					self.config.webView.webview.loadURL(url);
					self.config.currentUrl = url;
					self.config.requestUrl = url;
					self.globalMethods.closeWebControls();
					// self.config.mainNotification.show(url);
				},
				submitRequestUrl: function(url) {
					console.log('submitRequestUrl');
					// let requestURL = self.config.requestUrl.trim();
					let requestURL = url.trim();
					if (requestURL.indexOf('.') !== -1) {
						let httpFound = requestURL.indexOf('http://') !== -1 ? true : requestURL.indexOf('https://') !== -1 ? true : false;
						if (!httpFound && requestURL.indexOf('file://') === -1) {
							requestURL = "http://" + requestURL;
						}
					} else {
						requestURL = "https://www.google.at/search?q=" + encodeURI(requestURL);
					}
					self.globalMethods.navigateTo(requestURL);
				},
				requestSearchSuggestions: function(query, querySelect) {
					// TODO: REBUILD THIS FUNCTION
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
				}
				// doLayout: function() {
				// 	// let titleBar = document.querySelector('#electron_titlebar');
				// 	// let fullscreenContent = $('.fullscreen');
				// 	// let webViewBlocks = $(".webview");
				// 	// let titleBarHeight = titleBar.offsetHeight;
				// 	let windowWidth = document.documentElement.clientWidth;
				// 	let windowHeight = document.documentElement.clientHeight;
				// 	let mainWidth = windowWidth;
				// 	let mainHeight = windowHeight;
				// 	// let mainHeight = windowHeight - titleBarHeight;
				//
				// 	// webViewBlocks.width(mainWidth);
				// 	// webViewBlocks.height(mainHeight);
				// 	//
				// 	progressBar.style.width = mainWidth + 'px';
				// 	// if (self.config.webView.webview.getWebContents != undefined) {
				// 	// 	let wc = self.config.webView.webview.getWebContents();
				// 	// 	if(wc != null) {
				// 	// 		wc.setSize({
				// 	// 			normal: {
				// 	// 				width: mainWidth,
				// 	// 				height: mainHeight
				// 	// 			}
				// 	// 		});
				// 	// 	}
				// 	// }
				// }
			}
		};
	},
	mounted: function() {
		let self = this;
		body = $('body');

		progressBar = document.querySelector('#progress_bar');
		progressMeter = document.querySelector('#progress_meter');

		// debugger;
		if(self.config.webView == null || self.config.webView.webview === null) {
			// self.globalMethods.initNewWebView({ url: self.config.homepage }); //Start With Homepage
			self.globalMethods.initNewWebView();
			self.globalMethods.openWebControls();
		}

		// window.onresize = self.globalMethods.doLayout;
		// self.globalMethods.doLayout()

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
					// self.globalMethods.toggleWebControls();
					// $("#web_content").removeClass('expose');
					break;
				case 'reloadSite':
					self.config.webView.webview.reload();
					break;
				case 'goBack':
					if (self.config.webView.webview.canGoBack()) {
						self.config.webView.webview.goBack();
					}
					break;
				case 'goForward':
					if (self.config.webView.webview.canGoForward()) {
						self.config.webView.webview.goForward();
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
						self.globalMethods.closeWebControls();
					} else {
						menuItemCall("quitApp");
					}
					break;
				case 'viewDevTools':
					console.log('View Dev Tools');
					if(self.config.webView.webview.isDevToolsOpened() && self.config.webView.webview.isDevToolsFocused())
						self.config.webView.webview.closeDevTools();
					else {
						self.config.webView.webview.openDevTools();
					}
					break;
				case 'goToBookMarkNr0':
					self.globalMethods.navigateTo(self.config.bookmarks[0].url);
					self.config.mainNotification.show(self.config.bookmarks[0].title);
					break;
				case 'goToBookMarkNr1':
					self.globalMethods.navigateTo(self.config.bookmarks[1].url);
					self.config.mainNotification.show(self.config.bookmarks[1].title);
					break;
				case 'goToBookMarkNr2':
					self.globalMethods.navigateTo(self.config.bookmarks[2].url);
					self.config.mainNotification.show(self.config.bookmarks[2].title);
					break;
				case 'goToBookMarkNr3':
					self.globalMethods.navigateTo(self.config.bookmarks[3].url);
					self.config.mainNotification.show(self.config.bookmarks[3].title);
					break;
				case 'goToBookMarkNr4':
					self.globalMethods.navigateTo(self.config.bookmarks[4].url);
					self.config.mainNotification.show(self.config.bookmarks[4].title);
					break;
				case 'goToBookMarkNr5':
					self.globalMethods.navigateTo(self.config.bookmarks[5].url);
					self.config.mainNotification.show(self.config.bookmarks[5].title);
					break;
				case 'goToBookMarkNr6':
					self.globalMethods.navigateTo(self.config.bookmarks[6].url);
					self.config.mainNotification.show(self.config.bookmarks[6].title);
					break;
				case 'goToBookMarkNr7':
					self.globalMethods.navigateTo(self.config.bookmarks[7].url);
					self.config.mainNotification.show(self.config.bookmarks[7].title);
					break;
				case 'goToBookMarkNr8':
					self.globalMethods.navigateTo(self.config.bookmarks[8].url);
					self.config.mainNotification.show(self.config.bookmarks[8].title);
					break;
				case 'goToBookMarkNr9':
					self.globalMethods.navigateTo(self.config.bookmarks[9].url);
					self.config.mainNotification.show(self.config.bookmarks[9].title);
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
						type: 'separator'
					},
					{
						label: 'Quick Open Tab Controls...',
						accelerator: 'CmdOrCtrl+E',
						role: 'tabExpose',
						click: function(menuItem, currentWindow) {
							// menuItemCall('tabExpose');
							menuItemCall('openWebControls');
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
						type: 'separator'
					},
					{
						role: 'forcereload'
					},
					{
						label: 'View Dev Tools',
						accelerator: 'CmdOrCtrl+Alt+I',
						role: 'viewdevtools',
						click: function(menuItem, currentWindow) {
							menuItemCall('viewDevTools');
						}
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
				label: 'Bookmarks',
				submenu: []
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
			template[5].submenu = [{
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

		// Fill Bookmarks Menu
		for (var bookmarkIndex = 0; bookmarkIndex < self.config.bookmarks.length; bookmarkIndex++) {
			let bookmark = self.config.bookmarks[bookmarkIndex];
			let acceleratorIndex = bookmarkIndex < 9 ? bookmarkIndex + 1 : 0;
			let call = 'goToBookMarkNr' + bookmarkIndex;
			template[4].submenu.push(
				{
					label: bookmark.title,
					accelerator: 'CmdOrCtrl+' + acceleratorIndex,
					role: call,
					click: function(menuItem, currentWindow) {
						menuItemCall(call);
					}
				}
			);
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

#web_content {
	webview {
		visibility: hidden;
		z-index: 0;
		position: absolute;
		width: 100vw;
		height: 100vh;
		top: 0;
		left: 0;

		&.active {
			z-index: 1 !important;
			visibility: visible !important;
		}
		&.fresh_view {
			z-index: 0;
			visibility: visible;
		}
	}
}

#progress_bar {
	position: absolute;
	display: block;
	width: 100vw;
	height: .167rem;
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
		height: .167rem;
		background: #fb8800;
		background-image: linear-gradient(to right, #07eb7d 0%, #fb8800 40%, #fb8800 60%, #fb4d82 100%);
		transition: width 10s ease-in-out;
	}
}

#main_notify_history {
	.main_notify {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: center;
		bottom: 0;
		width: 100vw;
		z-index: 200;
		// background: rgba(#000, 0.7);
		// box-shadow: 0 0 10px 2px rgba(#000, 0.7);
		opacity: 0;
		pointer-events: none;
		border: 0 solid #fff;
		background-image: linear-gradient(60deg, #3d3393 0%, #2b76b9 37%, #2cacd1 65%, #35eb93 100%);
		// background-image: linear-gradient(60deg, rgba(#474394, 0.7) 0%, rgba(#2a5a7c, 0.7) 37%, rgba(#23b8d0, 0.7) 65%, rgba(#3dc986, 0.7) 100%);
		// background-image: linear-gradient(to right, #07eb7d 0%, #fb8800 40%, #fb8800 60%, #fb4d82 100%);
		// background-image: linear-gradient(to right, rgba(#07eb7d, 0.5) 0%, rgba(#fb8800, 0.5) 40%, rgba(#fb8800, 0.5) 60%, rgba(#fb4d82, 0.5) 100%);

		.main_notify_info {
			pointer-events: none;
			padding: .33rem;
			font-size: 2rem;
			font-weight: 400;
			color: #fff;
			max-width: 90vw;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		&.show {
			animation-name: showNotification;
			animation-duration: 1.25s;
		}
}

}

@keyframes showNotification {
	0% {opacity: .5;}
	15% {opacity: 1;}
	80% {opacity: 1;}
	100% {opacity: 0;}
}
</style>
