<template lang="html">
<div id="find_controls" class="find_controls d-flex flex-row align-items-center" v-bind:class="{'match': config.findResult != null && config.findResult.matches > 0, 'nomatch': config.findResult != null && config.findResult.matches <= 0 }">
	<input id="find_text" type="text" value="" class="form-control form-control-lg"
		v-on:input="onFindInputChange()"
		v-on:keydown="findKeyDown()">
	<div id="match_count" class="match_count mr-3">{{ config.findResult != null && config.findResult.matches > 0 ? config.findResult.matches > 1 ? config.findResult.matches + ' matches' : config.findResult.matches + ' match' : '' }}</div>
	<div id="prev_match" class="prev_match match_btn d-flex align-items-center justify-content-center"
		v-if="config.findResult != null && config.findResult.matches > 1"
		v-on:click.prevent="findInPage(false);">
		<i class="fas fa-angle-left"></i>
	</div>
	<div id="next_match"  class="next_match match_btn d-flex align-items-center justify-content-center"
		v-if="config.findResult != null && config.findResult.matches > 1"
		v-on:click.prevent="findInPage(true);">
		<i class="fas fa-angle-right"></i>
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
		console.log('#find_controls mounted.');
		this.tbFindGotFocus();

	},
	methods: {
		tbFindGotFocus: function() {
			let findForm = $('#find_controls');
			let findText = $('#find_text');

			findText.focus();
			findText.select();
		},
		onFindInputChange: function() {
			let webview = this.config.webView.webview;
			let findText = $('#find_text')[0];

			if(findText.value != null && findText.value != ''){
				// console.log('findInPage', findText.value);
				webview.findInPage(findText.value, {});
			} else {
				this.config.findResult = null;
			}
		},
		findKeyDown: function() {
			let webview = this.config.webView.webview;
			let findText = $('#find_text')[0];

			// console.log(event);
			if(findText.value != null && findText.value != ''){
				if (event.code === "Enter") {
					event.preventDefault();
					if(event.shiftKey) {
						this.findInPage(false);
					} else{
						this.findInPage(true);
					}
				} else if (event.code === "KeyG" && event.metaKey) {
					if(event.shiftKey) {
						this.findInPage(false);
					} else{
						this.findInPage(true);
					}
				}
			}
		},
		findInPage: function(forward) {
			let webview = this.config.webView.webview;
			let findText = $('#find_text')[0];

			if(findText.value != null && findText.value != ''){
				webview.findInPage(findText.value, { findNext: true, forward: forward });
			}
		}
	}
}
</script>

<style lang="scss">

.find_controls {
	position: absolute;
	width: 100vw;
	bottom: 0;
	height: 3rem;
	z-index: 1;
	border-top: .5px solid #858585;
	background-image: linear-gradient(60deg, #e7e7e7 0%, #cdcdcd 100%);
	// background-image: linear-gradient(60deg, #e84d4d 0%, #e83434 100%);

	#find_text {
		background: none;
		border: none;
		outline: none;
		box-shadow: none;
	}

	#match_count {
		color: #fff;
		font-weight: 400;
		font-size: 1.25rem;
		width: auto;
		white-space: nowrap;
	}

	.match_btn {
		height: 100%;
		width: 4rem;
		color: rgba(#000, 0.3);
		font-size: 1.75rem;
		text-align: center;
		border-left: .5px solid #007340;

		svg {
			cursor: pointer;
			pointer-events: none;
		}

		&.prev_match {
			background-image: linear-gradient(60deg, #2daa82 0%, #12bb86 100%);

		}
		&.next_match {
			background-image: linear-gradient(270deg, #2daa82 0%, #12bb86 100%);
		}
		&:hover {
			transition: all .15s;
			cursor: pointer;
			color: rgba(#000, 0.4);
			background-image: linear-gradient(60deg, #29ad83 0%, #0d9368 100%);
		}
	}

	&.match {
		border-top: .5px solid #007340;
		background-image: linear-gradient(60deg, #3cba92 0%, #0ba360 100%);

		#find_text {
			color: #fff;
		}
	}

	&.nomatch {
		border-top: .5px solid #670505;
		background-image: linear-gradient(60deg, #ba3c3c 0%, #a30b0b 100%);

		#find_text {
			color: #fff;
		}
	}
}
</style>
