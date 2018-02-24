import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'browser-frame',
      component: require('@/components/Browser').default
    },
    {
      path: '*',
      redirect: '/'
	}
  ]
});
