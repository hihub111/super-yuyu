import { createRouter, createWebHistory } from 'vue-router';
import { user, authReady, fetchMe } from './composables/useAuth.js';

const routes = [
  { path: '/login', component: () => import('./components/Login.vue') },
  { path: '/courses', component: () => import('./components/CourseList.vue') },
  { path: '/courses/:id', component: () => import('./components/CourseEditor.vue') },
  { path: '/', redirect: '/courses' },
  { path: '/:pathMatch(.*)*', redirect: '/courses' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫：恢复会话 + 登录校验
router.beforeEach(async (to) => {
  if (!authReady.value) await fetchMe();
  if (to.path !== '/login' && !user.value) return '/login';
  if (to.path === '/login' && user.value) return '/courses';
});

export default router;
