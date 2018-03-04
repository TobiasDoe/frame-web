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

$webView_blur: 1.5rem;

// Base Styles
* {
	-webkit-user-select:none;
	cursor: default;
}

html, body {
	height: 100%;
	display: flex;

	background-color: transparent;
	color: #464646;
	font-family: 'Raleway', sans-serif;
	font-weight: 100;
	margin: 0;

	font-size: 12px;

	background-image: linear-gradient(60deg, #625EB1 0%, #1D8FE1 37%, #22E1FF 65%, #5bf0a8 100%);
	// background-image: linear-gradient(60deg, rgba(#625eb1, 0.5) 0%, rgba(#3f6f91, 0.5) 37%, rgba(#22e1ff, 0.5) 65%, rgba(#5bf0a8, 0.5) 100%);
	// background-image: linear-gradient(60deg, #3d3393 0%, #2b76b9 37%, #2cacd1 65%, #35eb93 100%);
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

	&.web_controls_presented {
		#web_content {
			webview.active {
				animation-name: blurWebView;
				animation-fill-mode: forwards;
				animation-duration: .45s;
				animation-timing-function: ease-in;
			}
		}
	}

	@keyframes blurWebView {
		0% { opacity: 1; filter: blur(.4rem); }
		100% { opacity: .8; filter: blur(2rem); }
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
	height: 1.8rem;
	width: 100vw;
	pointer-events: none;
	left: 0;
	top: 0;
	// background: green;
	// border-radius: 50%;
	// width: 1rem;
	// left: 8px;
	// top: 5px;
	// background: #0872dd;
	// border: .5px solid darken(#0872dd, 5%);
	// &:hover {
	// 	background: lighten(#0872dd, 10%);
	// }
}
.window_blured {
	// .move_me {
	// 	background: #dddddd;
	// 	border: .5px solid darken(#dddddd, 5%);
	// }
}
</style>
