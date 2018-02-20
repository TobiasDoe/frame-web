<template lang="html">
<div id="web_controls" class="fullscreen web_controls d-flex w-100 flex-column align-items-center">
	<div id="url_bar" class="w-75 mt-5">
		<h2 id="page_title" class="flex-center">{{ config.currentUrl }}</h2>
		<form id="url_form" class="">
			<div class="from-group">
				<input id="tb_url" type="text" value="" class="form-control form-control-lg" v-model="config.requestUrl"
					v-on:input="globalMethods.requestSearchSuggestions(config.requestUrl, true)">
				<input type="submit" value="Go" hidden v-on:click.prevent="globalMethods.submitRequestUrl()">
			</div>
		</form>
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
		//
	}
}
</script>

<style lang="scss">
$aqua_input_bg: #fff;
$aqua_input_text: #111;
$aqua_input_bg_blur: #f0efef;
$aqua_input_text_blur: #fff;
$aqua_input_text_focus_border: #fff;

$web_controls_top_spacing: 20vh;

#web_controls {
	color: $aqua_input_text_blur;
	padding-top: $web_controls_top_spacing;
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

	#url_bar {
		z-index: 1;
		#url_form {

			input#tb_url[type=text] {
				height: 2.5rem;
				width: 100%;
				outline: 0;
				padding: 0 .4375rem;
				font-size: 1.5rem;
				text-align: center;
				background-color: $aqua_input_bg_blur;

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
}
</style>
