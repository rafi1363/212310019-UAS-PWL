import Vue from 'vue';
import Router from 'vue-router';
import Logos from './components/Logos.vue';
import HelloWorld from './components/HelloWorld.vue';

Vue.use(Router);

export default new Router({
name : 'BaseRoute',
  mode: 'history',
//   base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Logos
      },
      {
          path: '/hello-world',
          name: 'HelloWorld',
          component: HelloWorld
      }
    // ... other routes
  ]
});
