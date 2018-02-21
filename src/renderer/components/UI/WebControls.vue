<template lang="html">
<div id="web_controls" class="web_controls">
	<div class="inner_web_controls webkit-draggable fullscreen d-flex w-100 flex-column align-items-center">
		<h2 id="page_title" class="page_title flex-center mb-5 w-75">{{ config.webViews[config.currentWebViewIndex].title }}</h2>
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
				<div class="">
					<input id="tb_url" type="text" value="" class="form-control form-control-lg" v-model="config.requestUrl"
					v-on:input="globalMethods.requestSearchSuggestions(config.requestUrl, true)">
					<input type="submit" value="Go" hidden v-on:click.prevent="globalMethods.submitRequestUrl()">
				</div>
			</form>
		</div>
	</div>
</div>
</template>

<script>
export default {
	props: ['globalMethods', 'config'],
	data: function() {
		return {
			//
		};
	},
	mounted() {
		console.log('#web_controls mounted.');
		let urlBar = $('#tb_url');
		urlBar.focus();
		urlBar.select();
	},
	methods: {
		goToTabByIndex: function(webview) {
			this.globalMethods.presentTabByIndex(webview.index);
			this.globalMethods.closeWebControls();
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

.web_controls {
	color: $aqua_input_text_blur;
	// background: rgba(0, 0, 0, 0.8);
	:after {
		content: "";
		opacity: .4;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		z-index: -1;
		position: absolute;
		background-image: linear-gradient(60deg, #3d3393 0%, #2b76b9 37%, #2cacd1 65%, #35eb93 100%);
	}
	.inner_web_controls {
		padding-top: $web_controls_top_spacing;
		z-index: 1;
	}
	.url_bar {
		.url_form {

			input#tb_url[type=text] {
				width: 100%;
				outline: 0;
				font-size: 1.5rem;
				text-align: center;
				background-color: rgba(#cdcdcd, 0.5);

				&:focus {
					background-color: $aqua_input_bg;
					color: $aqua_input_text;
					// text-align: left;

					border-color: #fb8800;
					outline: 0;
					box-shadow: 0 0 0 0.2rem rgba(#fb8800, .25);

					&::-webkit-input-placeholder { color:transparent; }
					&:-moz-placeholder { color:transparent; } /* FF 4-18 */
					&::-moz-placeholder { color:transparent; } /* FF 19+ */
					&:-ms-input-placeholder { color:transparent; } /* IE 10+ */
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
			}
		}
	}
}
</style>
