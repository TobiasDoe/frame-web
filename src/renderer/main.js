const electron = require('electron');
const {
	app,
	Menu
} = electron.remote;

import Vue from 'vue';
import axios from 'axios';

import 'bootstrap/dist/css/bootstrap.min.css';

import App from './App';
import router from './router';
import store from './store';

if (!process.env.IS_WEB) {
	Vue.use(require('vue-electron'));
}
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

window.$ = window.jQuery = require('jquery');
window.Tether = require('tether');
window.Bootstrap = require('bootstrap');

// console.log('version', app.getVersion());
// console.log('name', app.getName());
import "../libraries/fontawesome/js/fontawesome-all.min.js";

/* eslint-disable no-new */
new Vue({
	components: {
		App
	},
	router,
	store,
	template: '<App/>'
}).$mount('#app');
