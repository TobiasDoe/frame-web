<template>
	<div id="app" class="main">
		<span class="move_me webkit-draggable"></span>
		<router-view></router-view>
	</div>
</template>

<script>
	export default {
		name: 'frame'
	}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Raleway:300,400,600');

$webView_blur: .8rem;

// Base Styles
html, body {
	height: 100%;
	display: flex;

	background-color: #f5f8fa;
	color: #464646;
	font-family: 'Raleway', sans-serif;
	font-weight: 100;
	margin: 0;

	font-size: 12px;

	button {
		cursor: pointer;
	}

	.main {
		height: 100vh;
		width: 100vw;
		display: flex;
		position: relative;
		.main_frame {
			flex: 1;
			display: flex;
			flex-direction: column;

			.navigation_content {
				flex: auto;
				width: 100vw;
				max-height: 58px;

				.navbar {
					z-index: 1000;
				}
			}

			.main_content{
				flex: auto;
				overflow-y: scroll;
			}
		}
	}

	&.modal_open {
		#web_content {
			filter: blur($webView_blur);
		}
	}

}

button, input {
	-webkit-app-region: no-drag;
}

.webkit-draggable {
	-webkit-app-region: drag;
}

.full-height {
	height: 100vh;
}

.fullscreen {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.flex-center {
	align-items: center;
	display: flex;
	justify-content: center;
}

.position-ref {
	position: relative;
}

.hidden {
	display: none !important;
}

.move_me {
	z-index: 1000;
	display: inline-block;
	position: absolute;
	width: 1rem;
	height: 1rem;
	background: #dddddd;
	left: 68px;
	top: 5px;
	border-radius: 50%;
	border: .5px solid darken(#dddddd, 5%);
	&:hover {
		background: #0872dd;
		border: .5px solid darken(#0872dd, 5%);
	}
}
</style>
