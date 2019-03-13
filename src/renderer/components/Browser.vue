<template>
	<div id="main_container" class="main_frame position-ref">
		<div id="goback_box" class="d-flex align-center justify-content-center align-items-center"
			v-bind:style="'transform: translateX(' + config.gestureControl.translateX() + 'px);'"
			v-bind:class="{'active': config.gestureControl.translateX() >= 125, 'show': config.gestureControl.isBackAnimated }">
			<img src="../assets/chevron-left.svg" width="80" height="80" class="d-inline-block align-center" alt="">
		</div>
		<div id="goforward_box" class="d-flex align-center justify-content-center align-items-center"
			v-bind:style="'transform: translateX(' + config.gestureControl.translateX() + 'px);'"
			v-bind:class="{'active': config.gestureControl.translateX() <= -125, 'show': config.gestureControl.isForwardAnimated }">
			<img src="../assets/chevron-right.svg" width="80" height="80" class="d-inline-block align-center" alt="">
		</div>
		<div id="web_content" class="fullscreen web_content">
			<!-- <webview class="full-height" :src="config.currentUrl" autosize></webview> -->
		</div>
		<div class="progress_bar" id="progress_bar">
			<span id="progress_meter"></span>
		</div>
		<div id="main_notify_history">
		</div>
		<div id="update_notify_history" v-bind:class="config.updateNotification.classes" v-if="config.webControlsOpen">
			<div id="update_notification" class="w-100">
				<div id="update_notification_text" class="update_notification_text">{{ config.updateNotification.text }}</div>
				<div id="update_options"class="update_options d-flex justify-content-end mt-2">
					<button id="btn_update_later" type="button" name="button" class="btn btn-outline-dark btn-lg mr-2" v-on:click="config.updateNotification.hide()">Later...</button>
					<button id="btn_update_now" type="button" name="button" class="btn btn-outline-primary btn-lg px-5" v-on:click="config.updateNotification.quitAndInstall()">Restart</button>
				</div>
			</div>
			<div id="update_progress" class="update_progress progress" style="height: 4px;">
				<div class="progress-bar" role="progressbar" v-bind:style="'width:' + config.updateNotification.download.progress + '%'" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
			</div>
		</div>
		<find-controls :globalMethods="globalMethods" :config="config" v-if="config.findControlsOpen"></find-controls>
		<web-controls :globalMethods="globalMethods" :config="config" v-if="config.webControlsOpen"></web-controls>
	</div>
</template>

<script>
import WebControls from './UI/WebControls';
import FindControls from './UI/FindControls';

const { electron, ipcRenderer, remote } = require('electron');
const { app, Menu } = remote;

import axios from 'axios';

let body = null;
let webViewIdCount = -1;

let progressBar = null;
let progressMeter = null;

export default {
	name: 'browser',
	components: { WebControls, FindControls },
	data: function() {
		let self = this;
		console.clear();
		return {
			config: {
				homepage: "https://www.github.com",
				currentUrl: "https://www.github.com",
				currentTitle: "",
				requestUrl: "https://www.github.com",
				webControlsOpen: false,
				findControlsOpen: false,
				findResult: null,
				webViews: [],
				webView: null,
				currentWebViewIndex: null,
				SearchSuggestions: [],
				URLSuggestions: [],
				blockGlobalInput: false,
				currentFocusSuggestions: -1,
				queryHistory: [],
				updateNotification: {
					text: 'Info',
					classes: {
						show: false,
						lock: false,
						options: false,
						download: false
					},
					download: {
						progress: 0
					},
					hide: function() {
						let that = this;
						setTimeout(function () {
							that.classes.show = false;
							that.classes.lock = false;
							that.classes.options = false;
							that.classes.download = false;
						}, 1250);
					},
					quitAndInstall: function() {
						ipcRenderer.send('request-quit-and-install');
					}
				},
				mainNotification: {
					count: -1,
					show: function(text) {
						this.count++;
						let rndClass = 'notify_id_' + this.count;
						let newMainNotify = $('<div class="main_notify show"></div>');
						newMainNotify.addClass(rndClass);
						let newMainNotifyInfo = $('<span class="main_notify_info text-truncate">' + text + '</span>');
						newMainNotify.append(newMainNotifyInfo);
						$('#main_notify_history').append(newMainNotify);
						// $('#main_notify').attr('class', '').addClass('show').addClass(rndClass);
						setTimeout(function () {
							$('.main_notify.' + rndClass).remove();
						}, 3000);
					}
				},
				gestureControl: {
					hasBegun: false,
					hasEnded: true,
					overEdgeScroll: false,
					distance: 0,
					isBackAnimated: false,
					isForwardAnimated: false,
					translateX: function() {
						// return this.distance > 75 || this.distance < -75 ? -this.distance : 0;
						let transition = 0;
						if (this.distance > 75) {
							transition = this.distance > 175 ? 125 : this.distance - 75;
						} else if (this.distance < -75) {
							transition = this.distance < -175 ? -125 : this.distance + 75;
						}
						return -transition;
					},
					showBack: function() {
						let that = this;
						that.isBackAnimated = true;
						setTimeout(function () {
							that.isBackAnimated = false;
						}, 1250);
					},
					showForward: function() {
						let that = this;
						that.isForwardAnimated = true;
						setTimeout(function () {
							that.isForwardAnimated = false;
						}, 1250);
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
				closeWebControls: function(force) {
					if(force || self.config.webView.title !== "New Tab" && self.config.webView.url !== ""){
						self.config.webControlsOpen = false;
						body.removeClass('modal_open');
						body.removeClass('web_controls_presented');

						// $('#tb_url').blur();

						$(self.config.webView.webview).blur();
						$(self.config.webView.webview).focus();
					}
				},
				toggleFindControls: function() {
					if(self.config.findControlsOpen && $("#find_text:focus").length > 0) {
						self.globalMethods.closeFindControls();
					} else {
						self.globalMethods.openFindControls();
					}
				},
				openFindControls: function() {
					self.globalMethods.closeWebControls();

					self.config.findControlsOpen = true;
					body.addClass('find_controls_presented');
					$('#find_text').focus();
					$('#find_text').select();
				},
				closeFindControls: function() {
					self.config.findControlsOpen = false;
					self.config.findResult = null;
					body.removeClass('find_controls_presented');

					self.config.webView.webview.stopFindInPage('keepSelection');

					$(self.config.webView.webview).blur();
					$(self.config.webView.webview).focus();
				},
				exitHTMLFullscreen: function() {
					self.config.webView.webview.executeJavaScript(
						"var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||" +
							"(document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||" +
							"(document.mozFullScreenElement && document.mozFullScreenElement !== null) ||" +
							"(document.msFullscreenElement && document.msFullscreenElement !== null);" +
							"" +
						"var docElm = document.documentElement;" +
						"if (!isInFullScreen) {" +
							"if (docElm.requestFullscreen) {" +
								"docElm.requestFullscreen();" +
							"} else if (docElm.mozRequestFullScreen) {" +
								"docElm.mozRequestFullScreen();" +
							"} else if (docElm.webkitRequestFullScreen) {" +
								"docElm.webkitRequestFullScreen();" +
							"} else if (docElm.msRequestFullscreen) {" +
								"docElm.msRequestFullscreen();" +
							"}" +
						"} else {" +
							"if (document.exitFullscreen) {" +
								"document.exitFullscreen();" +
							"} else if (document.webkitExitFullscreen) {" +
								"document.webkitExitFullscreen();" +
							"} else if (document.mozCancelFullScreen) {" +
								"document.mozCancelFullScreen();" +
							"} else if (document.msExitFullscreen) {" +
								"document.msExitFullscreen();" +
							"}" +
						"}"
					);
				},
				initNewWebView: function(target) {
					console.log('initNewWebView');
					let newWebView = $('<webview class="fresh_view" autosize webpreferences=""></webview>');

					newWebView
					.focusout(function() {
						console.log("newWebView focusout", $(this).attr('id'), $( "*:focus" )[0]);
					})
					.blur(function() {
						console.log("newWebView blur", $(this).attr('id'), $( "*:focus" )[0]);
					})
					.focus(function() {
						console.log("newWebView focus", $(this).attr('id'), $( "*:focus" )[0]);
					});

					newWebView.on("dom-ready", event => {
						console.log(event.target);
						// TODO: Remove this once https://github.com/electron/electron/issues/14474 is fixed
						if(!self.config.webControlsOpen && $(event.target).hasClass('active')) {
							console.log('focus hack');
							self.config.webView.webview.blur();
							self.config.webView.webview.focus();
						}
					});

					let src = target != null ? target.url : 'file://'; // self.config.homepage;
					webViewIdCount++;
					newWebView.attr("id", "webview_" + webViewIdCount);
					newWebView.attr("wv_index", webViewIdCount);
					newWebView.attr("src", src);
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
						// $(self.config.webView.webview).addClass('active');
					} else {
						self.config.mainNotification.show('Open in Tab: ' + target.url);
					}
					if (target == null) {
						if (self.config.webViews.length > 1) {
							self.globalMethods.openWebControls();
							$('#tb_url').focus();
							$('#tb_url').select();
						}
					}
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

					regView.addEventListener('wheel', self.globalMethods.webviewHandler.mouseWheelEvent);
					regView.addEventListener('found-in-page', self.globalMethods.webviewHandler.foundInPage);
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
						// console.log("handleLoadFinish", event.target.src);
						$(event.target).removeClass('fresh_view');
					},
					handleLoadStop: function() {
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
						// console.log("handlePageTitle", event);
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
						// console.log("handleFavIcon", event);
						let targetWvIndex = $(event.target).attr('wv_index');
						for (let wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
							if(self.config.webViews[wvIndex].index == targetWvIndex) {
								self.config.webViews[wvIndex].icon = event.favicons[0];
								break;
							}
						}
					},
					handleThemeColor: function(event) {
						// console.log("handleThemeColor", event);
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
						event.preventDefault();
						// debugger;
					},
					mouseWheelEvent: function(event) {
						// console.log("mouseWheelEvent", event);
						let gestureControl = self.config.gestureControl;
						let deltaX = event.deltaX;
						// console.log('deltaX', deltaX);
						let wasBelowZero = gestureControl.distance < 0 ? true : false;
						if(gestureControl.hasBegun && gestureControl.overEdgeScroll && !gestureControl.hasEnded) {
								gestureControl.distance += event.deltaX;
						}
						let isBelowZero = gestureControl.distance < 0 ? true : false;
						if(wasBelowZero !== isBelowZero){
							gestureControl.overEdgeScroll = false;
						}
					},
					foundInPage: function(event) {
						// console.log('foundInPage', event.result);
						let findControls = $('#find_controls');
						self.config.findResult= event.result;
					}
				},
				presentTabByIndex: function(tabIndex) {
					console.log('presentTabByIndex', tabIndex);
					for(let wvIndex = 0; wvIndex < self.config.webViews.length; wvIndex++) {
						console.log('presentTabByIndex inside for', wvIndex);
						let currWebView = self.config.webViews[wvIndex];
						if(currWebView.index !== tabIndex) {
							console.log('presentTabByIndex inside if');
							$(currWebView.webview).removeClass('active');
							$(currWebView.webview).attr("active", false);
							currWebView.webview.blur();
						} else {
							console.log('presentTabByIndex inside else');
							self.config.currentWebViewIndex = tabIndex;
							self.config.webView = currWebView;
							$(currWebView.webview).addClass('active');
							$(currWebView.webview).attr("active", true);
							self.config.mainNotification.show(currWebView.title);
							if (self.config.webControlsOpen) {
								$('#tb_url')[0].value = self.config.webView.url;
							}
						}
					}
					if(self.config.webView != null){
						self.config.webView.webview.focus();
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
					// self.config.openTabs(self.config.webViews);
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
					console.log('findPrevTabIndex');
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
					console.log('navigateTo', url);
					self.config.webView.webview.loadURL(url);
					self.config.currentUrl = url;
					self.config.requestUrl = url;
					// console.log(self.config.webView.webview.history);
					if(url !== "file://") {
						self.globalMethods.closeWebControls(true);
					}
					// self.config.mainNotification.show(url);
				},
				searchTo: function(query) {
					let searchUrl = "https://www.google.at/search?q=" + encodeURI(query) + "&rct=j";
					self.globalMethods.navigateTo(searchUrl);
				},
				submitRequestUrl: function(url) {
					console.log('submitRequestUrl', url);
					// let requestURL = self.config.requestUrl.trim();
					let requestURL = url.trim();
					if (requestURL.indexOf('.') !== -1 && requestURL.indexOf(' ') === -1) {
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
					let searchQuery = "https://suggestqueries.google.com/complete/search?client=chrome&q=" + query;
					let config = {
						headers: {'Access-Control-Allow-Origin': '*'}
					};
					axios.get(searchQuery)
					.then(function (response) {
						// console.log('requestSearchSuggestions data',response);
						self.globalMethods.showSuggestions(response.data, querySelect);
					})
					.catch(function (error) {
						console.log(error);
					});
				},
				showSuggestions: function(obj, querySelect) {
					// let obj = $.parseJSON(data);
					const query = obj[0];
					if (query === self.config.webView.url) {
						self.config.SearchSuggestions = [];
						self.config.URLSuggestions = [];
						self.config.currentFocusSuggestions -1;

						let suggestionsArray = obj[1];
						let infoArray = obj[2];
						let typeArray = obj[4]['google:suggesttype'];


						for (let suggestionsIndex = 0; suggestionsIndex < suggestionsArray.length && suggestionsIndex < 10; suggestionsIndex++) {
							let suggestion = suggestionsArray[suggestionsIndex];
							let info = infoArray[suggestionsIndex];
							let type = typeArray[suggestionsIndex];
							if (type != null && type === "NAVIGATION") {
								self.config.URLSuggestions.push({ suggestion: suggestion, info: info, call: self.globalMethods.navigateTo});
								if (self.config.URLSuggestions.length === 1 && querySelect === true) {
									self.globalMethods.addSuggestionToUrl(suggestion);
								}
							} else {
								self.config.SearchSuggestions.push({ suggestion: suggestion, info: info, call: self.globalMethods.searchTo});
							}
						}
						self.config.currentFocusSuggestions = -1;
					}
				},
				addSuggestionToUrl: function(suggestion) {
					if (suggestion.indexOf(self.config.webView.url) !== -1) {
						let beginAddString = suggestion.indexOf(self.config.webView.url) + self.config.webView.url.length;
						let addUrlPart = suggestion.substr(beginAddString);
						let start = self.config.webView.url.length;
						self.config.webView.url += addUrlPart;
						$('#tb_url')[0].value = self.config.webView.url;
						let end = self.config.webView.url.length;
						$('#tb_url')[0].setSelectionRange(start, end);
						// debugger;
					}
				},
				urlBarKeyDown: function(event) {
					// console.log("urlBarKeyDown", event);
					self.config.blockGlobalInput = false;
					let key = event.keyCode;
					if (key === 13) {
						event.preventDefault();
						if (self.config.currentFocusSuggestions > -1) {
							let suggestion = null;
							if (self.config.currentFocusSuggestions >= self.config.URLSuggestions.length) {
								suggestion = self.config.SearchSuggestions[self.config.currentFocusSuggestions - self.config.URLSuggestions.length];
							} else {
								suggestion = self.config.URLSuggestions[self.config.currentFocusSuggestions];
							}
							suggestion.call(suggestion.suggestion);
						} else {
							self.globalMethods.submitRequestUrl(self.config.webView.url);
						}
						self.config.URLSuggestions = [];
						self.config.SearchSuggestions = [];
					} else if (key === 9 && event.ctrlKey !== true) { // key: TAB
						event.preventDefault();
						let end = self.config.webView.url.length;
						$('#tb_url')[0].setSelectionRange(end, end);
					} else if (key === 8) {
					} else if (((key === 65 || key === 17) && event.ctrlKey === true) || key === 119) {
						self.config.blockGlobalInput = true;
					} else if (key === 17) {
						self.config.blockGlobalInput = true;
					} else if (key === 38 || key === 40) {
						self.config.blockGlobalInput = true;
						event.preventDefault();
						switch (key) {
							case 38:
								if (self.config.currentFocusSuggestions !== -1) {
									self.config.currentFocusSuggestions = self.config.currentFocusSuggestions - 1;
								}
								break;
							case 40:
								if (self.config.currentFocusSuggestions !== (self.config.SearchSuggestions.length + self.config.URLSuggestions.length) - 1) {
									self.config.currentFocusSuggestions = self.config.currentFocusSuggestions + 1;
								}
								break;
						}
						self.globalMethods.onSuggestionSelectionChange();
					}
				},
				onSuggestionSelectionChange: function() {
					let suggestion = null;
					if (self.config.currentFocusSuggestions >= self.config.URLSuggestions.length) {
						suggestion = self.config.SearchSuggestions[self.config.currentFocusSuggestions - self.config.URLSuggestions.length];
					} else {
						suggestion = self.config.URLSuggestions[self.config.currentFocusSuggestions];
					}
					// console.log(suggestion);
					if (suggestion != null) {
						// debugger;
						self.config.webView.url = suggestion.suggestion;
						$('#tb_url')[0].value = suggestion.suggestion;
					}
				}
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

		// window.onresize = function() {};

		ipcRenderer.on('leave-full-screen', function() {
			console.log("leave-full-screen");
			self.globalMethods.exitHTMLFullscreen();
		});

		ipcRenderer.on('window-lost-focus', function() {
			console.log("window-lost-focus");
			if(self.config.webView != null) {
				console.log("will blur", self.config.webView.webview);
				// $(self.config.webView.webview).focus();
				self.config.webView.webview.blur();
			}
		});

		ipcRenderer.on('window-got-focus', function() {
			console.log("window-got-focus");
			if(self.config.webView != null) {
				if(self.config.webControlsOpen) {
					// $('#tb_url').focus();
					// $('#tb_url').select();
				} else {
					console.log("will focus", self.config.webView.webview, 'from: '+ $(this).attr('id'), $( "*:focus" )[0]);
					// $(self.config.webView.webview).blur();
					self.config.webView.webview.focus();
				}
			}
		});

// -----------------------------------------------------------
// -------------------Scroll & Swipe Events-------------------
// -----------------------------------------------------------
		ipcRenderer.on('swipe', function(event, direction) {
			console.log('on swipe', direction);
			switch (direction) {
				case "left":
					menuItemCall('goForward');
					break;
				case "right":
					menuItemCall('goBack');
					break;
				case "down":
					break;
				case "up":
					self.globalMethods.toggleWebControls();
					break;
			}
		});
		ipcRenderer.on('scroll-touch-edge', function(event) {
			// console.log('on scroll-touch-edge', event);
			// console.log('on scroll-touch-edge');
			self.config.gestureControl.overEdgeScroll = true;
		});
		ipcRenderer.on('scroll-touch-begin', function(event) {
			// console.log('on scroll-touch-begin', event);
			// console.log('on scroll-touch-begin');
			self.config.gestureControl.hasBegun = true;
			self.config.gestureControl.hasEnded = false;
		});
		ipcRenderer.on('scroll-touch-end', function(event) {
			// console.log('on scroll-touch-end', event);
			if(self.config.gestureControl.distance > 175) {
				menuItemCall('goForward');
			} else if(self.config.gestureControl.distance < -175) {
				menuItemCall('goBack');
			}
			// console.log('on scroll-touch-end');
			// console.log('scroll-touch-edge-distance', self.config.gestureControl.distance);
			self.config.gestureControl.distance = 0;
			self.config.gestureControl.hasBegun = false;
			self.config.gestureControl.hasEnded = true;
			self.config.gestureControl.overEdgeScroll = false;
		});

// -----------------------------------------------------------
// ---------------------AutoUpdate-Events---------------------
// -----------------------------------------------------------
		ipcRenderer.on('checking-for-update', function(event) {
			console.log("checking-for-update");
			self.config.updateNotification.text = "Checking for Updates...";

			self.config.updateNotification.classes.show = false;
			self.config.updateNotification.classes.lock = true;
		});
		ipcRenderer.on('update-available', function(event, autoUpdate) {
			console.log("update-available", autoUpdate);
			self.config.updateNotification.text = "New Update available";

			self.config.updateNotification.classes.show = true;
			self.config.updateNotification.classes.lock = false;
		});
		ipcRenderer.on('update-not-available', function(event, autoUpdate) {
			console.log("update-not-available", autoUpdate);
			self.config.updateNotification.text = "frame is up to date!";

			self.config.updateNotification.classes.show = true;
			self.config.updateNotification.classes.lock = false;
			self.config.updateNotification.hide();
		});
		ipcRenderer.on('update-error', function(event, err) {
			console.log("There was a problem updating the application", err);
			self.config.updateNotification.text = "Update Error!";

			self.config.updateNotification.classes.show = false;
			self.config.updateNotification.classes.lock = true;
		});
		ipcRenderer.on('download-progress', function(event, progress) {
			console.log("download-progress", progress);
			self.config.updateNotification.text = "Downloading new Update...";
			self.config.updateNotification.download.progress =  progress.percent;

			self.config.updateNotification.classes.show = false;
			self.config.updateNotification.classes.lock = true;
			self.config.updateNotification.classes.download = true;
		});
		ipcRenderer.on('update-downloaded', function(event, autoUpdate, releaseNotes, releaseName) {
			console.log("update-downloaded", autoUpdate);

			self.config.updateNotification.text = "A new version has been downloaded.";

			self.config.updateNotification.classes.show = false;
			self.config.updateNotification.classes.lock = true;
			self.config.updateNotification.classes.download = false;
			self.config.updateNotification.classes.options = true;
		});

// -----------------------------------------------------------
// -----------------------MenuItemCalls-----------------------
// -----------------------------------------------------------
		function menuItemCall(call) {
			switch (call) {
				case 'closeControls':
					if(self.config.webControlsOpen) {
						self.globalMethods.closeWebControls();
					} else if (self.config.findControlsOpen) {
						self.globalMethods.closeFindControls();
					}
					self.globalMethods.exitHTMLFullscreen();
					break;
				case 'openWebControls':
					self.globalMethods.toggleWebControls();
					// self.globalMethods.openWebControls();
					break;
				case 'closeWebControls':
					self.globalMethods.closeWebControls();
					// self.globalMethods.toggleWebControls();
					// $("#web_content").removeClass('expose');
					break;
				case 'openFindControls':
					self.globalMethods.toggleFindControls();
					break;
				case 'closeFindControls':
					self.globalMethods.closeFindControls();
					break;
				case 'reloadSite':
					self.config.webView.webview.reload();
					break;
				case 'goBack':
					if (self.config.webView.webview.canGoBack()) {
						self.config.webView.webview.goBack();
						self.config.gestureControl.showBack();
					}
					break;
				case 'goForward':
					if (self.config.webView.webview.canGoForward()) {
						self.config.webView.webview.goForward();
						self.config.gestureControl.showForward();
					}
					break;
				case 'quitApp':
					// console.log(remote);
					const window = remote.getCurrentWindow();
					window.close();
					break;
				case 'newTab':
					self.globalMethods.initNewWebView();
					break;
				case 'nextTab':
					self.globalMethods.presentTabByIndex(self.globalMethods.findNextTabIndex());
					break;
				case 'previousTab':
					self.globalMethods.presentTabByIndex(self.globalMethods.findPrevTabIndex());
					break;
				case 'closeTab':
					// menuItemCall("quitApp");
					if(self.config.webViews.length > 1){
						self.globalMethods.closeTabByIndex(self.config.currentWebViewIndex);
						// self.globalMethods.closeWebControls();
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
						label: 'Close Controls...',
						accelerator: 'esc',
						role: 'closeControls',
						click: function(menuItem, currentWindow) {
							menuItemCall('closeControls');
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
					},
					{
						type: 'separator'
					},
					{
						label: 'Find...',
						accelerator: 'CmdOrCtrl+F',
						role: 'openFindControls',
						click: function(menuItem, currentWindow) {
							menuItemCall('openFindControls');
						}
					}
				]
			},
			{
				label: 'View',
				submenu: [{
						label: 'Show Previous Tab',
						accelerator: 'Shift+Ctrl+tab',
						role: 'previousTab',
						click: function(menuItem, currentWindow) {
							menuItemCall('previousTab');
						}
					},
					{
						label: 'Show Next Tab',
						accelerator: 'Ctrl+tab',
						role: 'nextTab',
						click: function(menuItem, currentWindow) {
							menuItemCall('nextTab');
						}
					},
					{
						type: 'separator'
					},
					{
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
						label: 'Check for Update...',
						accelerator: '',
						role: 'update-app',
						click: function(menuItem, currentWindow) {
							ipcRenderer.send('request-checking-for-update');
						}
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
#goback_box, #goforward_box {
	position: absolute;
	height: 100vh;
	width: 80px;
	transition: all .25s;
	// filter:drop-shadow(0 0 5px #000);
	opacity: .6;
	z-index: 1000;
	pointer-events: none;

	&.active {
		opacity: 1;
	}
}
#goback_box {
	text-align: right;
	left: -80px;
	&.show {
		animation-name: showBack;
		animation-duration: 1.25s;
	}
}
#goforward_box {
	text-align: left;
	right: -80px;
	&.show {
		animation-name: showForward;
		animation-duration: 1.25s;
	}
}

#web_content {
	transition: all .25s;

	webview {
		visibility: hidden;
		z-index: 0;
		position: absolute;
		width: 100vw;
		height: 100vh;
		top: 0;
		left: 0;
		// background: #fff;

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

		background-image: linear-gradient(60deg, #505050 0%, #2E2E2E 100%);
		// background-image: linear-gradient(60deg, #3d3393 0%, #2b76b9 37%, #2cacd1 65%, #35eb93 100%);
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


#update_notify_history {
	position: absolute;
	top: 0;
	right: 0;
	z-index: 201;
	width: 380px;
	max-width: 80vw;
	opacity: 0;
	margin: .33rem;
	border: .5px solid rgba(#dbdbdb, 0.7);
	border-radius: 4px;
	background-color: rgba(#cdcdcd, 0.3);

	#update_notification {
		padding: .33rem;

		.update_notification_text {
			pointer-events: none;
			padding: .33rem;
			font-size: 1.3rem;
			font-weight: 400;
			color: #fff;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
	&:hover {
		border: .5px solid #dbdbdb;
		background-color: rgba(#cdcdcd, 0.5);
		color: #333333;
	}
	.update_options {
		display: none;
		button {
			display: none;
		}
	}
	&.options {
		.update_options {
			display: block;
			button {
				display: block;
			}
		}
	}
	#update_progress {
		display: none;
		.progress-bar {
			display: none !important;
		}
	}
	&.download {
		#update_progress {
			display: flex;
			.progress-bar {
				display: flex !important;
			}
		}
	}
	&.show {
		animation-name: showNotification;
		animation-duration: 1.25s;
	}
	&.lock {
		animation-name: showUpdateNotification;
		animation-duration: 1.25s;
		animation-fill-mode: forwards;
	}
}
@keyframes showUpdateNotification {
	0% {opacity: 0;}
	35% {opacity: .8;}
	100% {opacity: 1;}
}
@keyframes showNotification {
	0% {opacity: .5;}
	15% {opacity: 1;}
	80% {opacity: 1;}
	100% {opacity: 0;}
}
@keyframes showBack {
	0% { transform: translateX(125px); opacity: 1; }
	80% { transform: translateX(125px); opacity: 1; }
	100% { transform: translateX(0px); opacity: .6; }
}
@keyframes showForward {
	0% { transform: translateX(-125px); opacity: 1; }
	80% { transform: translateX(-125px); opacity: 1; }
	100% { transform: translateX(0px); opacity: .6; }
}

</style>
