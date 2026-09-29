import { createRouter, createWebHistory } from 'vue-router'

const Placeholder = () => import('@/views/placeholder/index.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/',
      component: () => import('@/layout/index.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/HomeView.vue'),
          meta: { title: '系统首页' },
        },
        {
          path: 'entrust',
          name: 'entrust',
          component: () => import('@/views/entrust/index.vue'),
          meta: { title: '委托管理' },
        },
        {
          path: 'project',
          name: 'project',
          component: () => import('@/views/project/index.vue'),
          meta: { title: '试验项目' },
        },
        {
          path: 'sample-ledger',
          name: 'sample-ledger',
          component: () => import('@/views/sample-ledger/index.vue'),
          meta: { title: '样机台账' },
        },
        {
          path: 'test/pending',
          name: 'test-pending',
          component: Placeholder,
          meta: { title: '待测单' },
        },
        {
          path: 'test/ongoing',
          name: 'test-ongoing',
          component: Placeholder,
          meta: { title: '在测单' },
        },
        {
          path: 'test/done',
          name: 'test-done',
          component: Placeholder,
          meta: { title: '已测单' },
        },
        {
          path: 'file/wi',
          name: 'file-wi',
          component: Placeholder,
          meta: { title: '作业指导书' },
        },
        {
          path: 'file/lab',
          name: 'file-lab',
          component: Placeholder,
          meta: { title: '实验室文件' },
        },
        {
          path: 'user/account',
          name: 'user-account',
          component: Placeholder,
          meta: { title: '账号管理' },
        },
        {
          path: 'user/client',
          name: 'user-client',
          component: Placeholder,
          meta: { title: '委托人管理' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: Placeholder,
          meta: { title: '系统设置' },
        },
      ],
    },
  ],
})

export default router