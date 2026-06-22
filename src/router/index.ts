import { createWebHistory, createRouter } from "vue-router";

import Home from "@/views/home/Home.vue";
import Login from "@/views/login/Login.vue";

const routes = [
  { path: "/", redirect: "/home" },
  { 
    path: "/home", 
    component: Home,
    meta: { requiresAuth: true }
  },
  { 
    path: "/login", 
    component: Login,
    meta: { requiresAuth: false }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from) => {
  const token = localStorage.getItem('accessToken');

  if (to.meta.requiresAuth) {
    if (token) {
      return true;
    } else {
      return('/login');
    }
  } else {
    if (to.path === '/login' && token) {
      return('/home');
    } else {
      return true;
    }
  }
});

export default router;
