<template lang="html">
<div id="find_controls" class="find_controls">
	<input id="find_text" type="text" value="" class="form-control form-control-lg"
		v-on:input="onFindInputChange()">
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
		this.testFunc();

	},
	methods: {
		testFunc: function() {
			//
		},
		onFindInputChange: function() {

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
	background-image: linear-gradient(60deg, #3cba92 0%, #0ba360 100%);
	// background-image: linear-gradient(60deg, #ba3c3c 0%, #a30b0b 100%);
	// background-image: linear-gradient(60deg, #e84d4d 0%, #e83434 100%);

	#find_text {
		background: none;
		border: none;
		outline: none;
		box-shadow: none;
	}

}
</style>
