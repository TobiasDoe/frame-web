<template>
	<div id="web_controls" class="web_controls">
		<div class="inner_web_controls fullscreen d-flex w-100 flex-column align-items-center">
			<h2 id="page_title" class="page_title flex-center mb-5 w-75">{{ config.webView.title == "New Tab" ? "This is Major Tom to Ground Control" : config.webView.title }}</h2>
			<div id="tab_bar" class="tab_bar w-75 d-flex justify-content-center">
				<span class="tab_card navbar-brand px-3" v-for="webview in config.webViews"
					v-bind:class="webview.index === config.currentWebViewIndex ? 'current' : ''"
					v-on:click="goToTabByIndex(webview)">
					<img class="align-middle mr-2" :src="webview.icon" alt="">
					<span class="align-middle">{{ webview.title }}</span>
				</span>
			</div>
			<div id="url_bar" class="url_bar w-75">
				<form id="url_form" class="url_form">
					<span id="tb_url_ghost" class="tb_url_ghost form-control form-control-lg"
						v-on:click="presentUrlBar()"><span class="ghorst_text">{{ config.webView.url != '' ? config.webView.url : 'Search or enter website name' }}</span></span>
					<input id="tb_url" type="text" value="" class="form-control form-control-lg"
						v-model.lazy="config.webView.url"
						v-on:focus="presentUrlBar()"
						v-on:blur="presentGhost()"
						v-on:keydown.shift.ctrl.tab.prevent="globalMethods.presentTabByIndex(globalMethods.findPrevTabIndex());"
						v-on:keydown.ctrl.tab.prevent.stop="globalMethods.presentTabByIndex(globalMethods.findNextTabIndex());"
						v-on:keyup="globalMethods.urlBarKeyDown"
						v-on:keydown.tab.prevent=""
						v-on:keydown.38.prevent=""
						v-on:keydown.40.prevent=""
						v-on:keydown.enter.prevent=""
						v-on:input="onUrlBarChange()">
					<!-- <input type="submit" value="Go" hidden v-on:click.prevent="globalMethods.submitRequestUrl(config.webView.url)"> -->
				</form>
			</div>
			<div class="suggestions_bar w-75" id="suggestions_bar" v-if="(this.urlBarHasFocus === true && (config.SearchSuggestions.length != 0 || config.URLSuggestions.length != 0))">
				<div class="websites">
					<div class="group" v-if="config.SearchSuggestions.length != 0">websites</div>
						<div class="" v-for="(suggestion, index) in config.URLSuggestions">
							<div class="suggestion_row" v-bind:class="config.currentFocusSuggestions === index ? 'selected' : ''">
								<span class="suggestion">{{ suggestion.suggestion }}</span><span class="info" v-if="suggestion.info != ''">{{ ' - ' + suggestion.info }}</span>
							</div>
						</div>
				</div>
				<div class="searches">
					<div class="group" v-if="config.URLSuggestions.length != 0">Search with Google</div>
						<div class="" v-for="(suggestion, index) in config.SearchSuggestions">
						<div class="suggestion_row" v-bind:class="config.currentFocusSuggestions === config.URLSuggestions.length + index ? 'selected' : ''">
							<span class="suggestion">{{ suggestion.suggestion }}</span><span class="info" v-if="suggestion.info != ''">{{ ' - ' + suggestion.info }}</span>
						</div>
					</div>
				</div>
			</div>
			<div class="bookmark_bar mt-5 w-75 d-flex flex-row flex-wrap justify-content-around" id="bookmark_bar" v-if="(config.SearchSuggestions.length == 0 && config.URLSuggestions.length == 0)">
				<div class="bookmark text-center p-3" v-for="(bookmark, index) in config.bookmarks">
					<span class="shortcut">{{ '⌘' + (index+1)}}</span>
					<span class="title">{{ bookmark.title }}</span>
				</div>
			</div>
		</div>
		<div class="action_bar w-25 d-flex flex-row flex-wrap justify-content-around" id="bookmark_bar">
			<div class="action text-center" data-toggle="tooltip" data-placement="top" title="New Tab">
				<span class="shortcut">⌘T</span>
				<span class="icon">#T</span>
				<span class="title">New Tab</span>
			</div>
			<div class="action text-center" data-toggle="tooltip" data-placement="top" title="Go Back">
				<span class="shortcut">⌘Left</span>
				<span class="icon">#Left</span>
				<span class="title">Go Back</span>
			</div>
			<div class="action text-center" data-toggle="tooltip" data-placement="top" title="Go Forward">
				<span class="shortcut">⌘Right</span>
				<span class="icon">#Right</span>
				<span class="title">Go Forward</span>
			</div>
			<div class="action text-center" data-toggle="tooltip" data-placement="top" title="Reload">
				<span class="shortcut">⌘R</span>
				<span class="icon">#R</span>
				<span class="title">Reload</span>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: ['globalMethods', 'config'],
	data: function() {
		return {
			urlBarHasFocus: false
		};
	},
	mounted() {
		console.log('#web_controls mounted.');
		this.tbUrlGotFocus();

	},
	methods: {
		goToTabByIndex: function(webview) {
			this.globalMethods.presentTabByIndex(webview.index);
			this.globalMethods.closeWebControls();
		},
		tbUrlGotFocus: function() {
			this.presentUrlBar();
		},
		presentUrlBar: function() {
			let urlForm = $('#url_form');
			let urlBar = $('#tb_url');
			urlForm.removeClass('ghost_active');
			$(this.config.webView.webview).blur();
			urlBar.focus();
			this.urlBarHasFocus = true;
			urlBar.select();
		},
		presentGhost: function() {
			let urlForm = $('#url_form');
			let urlBar = $('#tb_url');
			urlBar.blur();
			// this.urlBarHasFocus = false;
			urlForm.addClass('ghost_active');
		},
		onUrlBarChange: function() {
			this.config.webView.url = event.target.value;
			let querySelect = this.config.queryHistory[this.config.queryHistory.length - 1] !== this.config.webView.url;
			if (!this.config.blockGlobalInput) {
				this.config.queryHistory.push(this.config.webView.url);
				this.globalMethods.requestSearchSuggestions(this.config.webView.url, querySelect);
			}
		}
	}
}
</script>

<style lang="scss">
$aqua_input_bg: #fff;
$aqua_input_text: #111;
$aqua_input_bg_blur: #f0efef;
$aqua_input_text_blur: #fff;
$aqua_input_text_focus_border: #fff;

$web_controls_top_spacing: 15vh;
$web_controls_blur_opacity: .8;

.web_controls {
	color: $aqua_input_text_blur;
	// background: rgba(0, 0, 0, 0.8);
	&:after {
		content: "";
		opacity: $web_controls_blur_opacity;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		z-index: 1;
		position: absolute;
		// background-image: linear-gradient(60deg, #3d3393 0%, #2b76b9 37%, #2cacd1 65%, #35eb93 100%);
		// background-image: linear-gradient(60deg, #934433 0%, #b9af2b 37%, #d1cf2c 65%, #35eb78 100%);
	}

	.inner_web_controls {
		padding-top: $web_controls_top_spacing;
		z-index: 2;
	}
	.url_bar {
		.url_form {

			input#tb_url[type=text], #tb_url_ghost {
				width: 100%;
				outline: 0;
				height: 41px;
				font-size: 1.5rem;
				text-align: center;


				background-color: rgba(#cdcdcd, 0.4);
				transition: background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;

				&::selection {
					background: rgba(#0192d9, 0.3);
				}

				&:focus {
					outline: 0;
					overflow: hidden;
					color: $aqua_input_text;
					text-align: left;
					padding-left: 6rem;

					background-color: rgba(#eeeeee, 0.55);

					border-color: #fff;
					// box-shadow: 0 0 10px 2px rgba(#fff, 0.7);

					&::-webkit-input-placeholder { color:transparent; }
				}
			}
			input#tb_url[type=text] {
				cursor: auto;
				background-color: rgba(#cdcdcd, 0.5);

				border-color: rgba(#fff, 1);
				box-shadow: 0 0 0 0 rgba(#fff, 0.0);
			}

			#tb_url_ghost {
				font-weight: 400;
				cursor: pointer;
				display: none;
				// opacity: 0;
				overflow: hidden;
				text-overflow: ellipsis;

				border-color: #dbdbdb;

				.ghorst_text {
					// background-image: linear-gradient(60deg, #f43b47 0%, #133a9e 100%);
					// -webkit-background-clip: text;
					// -webkit-text-fill-color: transparent;
					pointer-events: none;
				}

				&:hover {
					outline: 0;

					background-color: rgba(#cdcdcd, 0.5);

					border-color: rgba(#ebebeb, 1);
					box-shadow: 0 0 6px 0px rgba(#000, .4);
				}
			}

			&.ghost_active {
				#tb_url {
					opacity: 0;
					margin-top: -41px;
					pointer-events: none;
				}
				#tb_url_ghost {
					display: block;
					// opacity: 1;
				}
			}
		}
	}

	.suggestions_bar {
		padding-left: 6rem;
		// text-shadow: 0 0 .5px  #000;
		font-weight: 300;

		// color: #111;
		// border: .5px solid #dbdbdb !important;
		// background-color: rgba(#eeeeee, 0.55);
		// border-bottom-right-radius: 4px;
		// border-bottom-left-radius: 4px;

		.suggestion_row {
			font-size: 1.8rem;

			&.selected, &:hover {
				text-shadow: none;
				.suggestion {
					cursor: pointer;
					background-image: linear-gradient(60deg, #e8202d 0%, #D42B36 100%);
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					// font-weight: 400;
				}
				.info {
					cursor: pointer;
					background-image: linear-gradient(60deg, #e6e3e3 0%, #fff 100%);
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					// font-weight: 400;
				}
			}

		}
	}
	.bookmark_bar {
		display: none !important;

		.bookmark {
			width: auto;
			font-size: 2rem;
			border: .5px solid transparent;

			.shortcut {
				font-family: "Helvetica Neue";
				font-weight: 400;
			}

			&:hover {
				border: .5px solid rgba(#ffffff, 0.3);
				background-color: rgba(#cdcdcd, 0.3);
				color: #333333;
				border-radius: 4px;
				cursor: pointer;
				* {
					cursor: pointer;
				}
			}
		}
	}
	.action_bar {
		display: none !important;

		position: absolute;
		bottom: 0rem;
		border: .5px solid rgba(#ffffff, 0.3);
		border-bottom: none;
		background-color: rgba(#cdcdcd, 0.3);
		border-top-right-radius: 4px;
		// border-top-left-radius: 4px;
		z-index: 4;

		.action {
			width: auto;
			font-size: 1.6rem;
			border: .5px solid transparent;
			position: relative;
			width: 4.33rem;
			overflow: hidden;

			.shortcut {
				display: none;
				font-family: "Helvetica Neue";
				font-weight: 400;
			}
			.icon {
				display: block;
			}
			.title {
				display: none;
			}

			&:hover {
				background-color: rgba(#cdcdcd, 0.3);
				color: #333333;
				cursor: pointer;
				* {
					cursor: pointer;
				}

				.shortcut {
					display: inline-block;
				}
				.icon {
					display: none;
				}
			}
		}
	}

	.tab_bar {
		.tab_card {
			max-width: 25%;
			overflow: hidden;
			text-overflow: ellipsis;
			border: .5px solid transparent;
			border-bottom: none !important;
			background-color: transparent;
			font-weight: bold;
			transition: all .25s;
			border-top-right-radius: 4px;
			border-top-left-radius: 4px;
			margin-left: .5rem;
			margin-right: .5rem;

			img {
				height: 22px;
				width: auto;
			}

			&.current {
				border: .5px solid #dbdbdb !important;
				border-bottom: none !important;
				background-color: rgba(#cdcdcd, 0.3);
				&:hover {
					// border-bottom-width: .5px !important;
				}
			}
			&:hover {
				border: .5px solid #fff;
				background-color: rgba(#cdcdcd, 0.5);
				color: #333333;
				cursor: pointer;
				* {
					cursor: pointer;
				}
			}
		}
	}
}
</style>
