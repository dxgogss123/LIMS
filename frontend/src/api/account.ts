// 账户管理接口封装（路径 /api/store/account）。
// 权限树与角色默认权限仍为前端静态配置，账户列表与每个账户的权限码持久化到后端。

import http from './http'

export const ROLE_OPTIONS = ['超级管理员', '管理员', '试验员', '审核员', '报告员'] as const
export type Role = (typeof ROLE_OPTIONS)[number]

export type AccountStatus = 'enabled' | 'disabled'

export interface AccountItem {
  id: number
  username: string
  name: string
  email: string
  phone: string
  roles: Role[]
  status: AccountStatus
}

export interface AccountQuery {
  page: number
  page_size: number
  keyword?: string
}

export interface AccountListResult {
  items: AccountItem[]
  total: number
  page: number
  page_size: number
}

export interface AccountPayload {
  username: string
  name: string
  email: string
  phone: string
  roles: Role[]
  permissionCodes: string[]
}

export interface PermissionNode {
  id: number
  name: string
  code: string
  parentId: number | null
  children?: PermissionNode[]
}

// ---- 权限 mock 数据 ----

const permissionTreeMock: PermissionNode[] = [
  {
    id: 1,
    name: '系统管理',
    code: 'system',
    parentId: null,
    children: [
      {
        id: 11,
        name: '账户管理',
        code: 'system.account',
        parentId: 1,
        children: [
          { id: 111, name: '新增', code: 'system.account.create', parentId: 11 },
          { id: 112, name: '编辑', code: 'system.account.edit', parentId: 11 },
          { id: 113, name: '删除', code: 'system.account.delete', parentId: 11 },
        ],
      },
      {
        id: 12,
        name: '委托人管理',
        code: 'system.client',
        parentId: 1,
        children: [
          { id: 121, name: '新增', code: 'system.client.create', parentId: 12 },
          { id: 122, name: '编辑', code: 'system.client.edit', parentId: 12 },
          { id: 123, name: '删除', code: 'system.client.delete', parentId: 12 },
        ],
      },
    ],
  },
  {
    id: 2,
    name: '试验管理',
    code: 'trial',
    parentId: null,
    children: [
      {
        id: 21,
        name: '委托单管理',
        code: 'trial.commission',
        parentId: 2,
        children: [
          { id: 211, name: '新增', code: 'trial.commission.create', parentId: 21 },
          { id: 212, name: '编辑', code: 'trial.commission.edit', parentId: 21 },
          { id: 213, name: '删除', code: 'trial.commission.delete', parentId: 21 },
        ],
      },
      {
        id: 22,
        name: '检测项管理',
        code: 'trial.testitem',
        parentId: 2,
        children: [
          { id: 221, name: '新增', code: 'trial.testitem.create', parentId: 22 },
          { id: 222, name: '编辑', code: 'trial.testitem.edit', parentId: 22 },
        ],
      },
    ],
  },
  {
    id: 3,
    name: '报告管理',
    code: 'report',
    parentId: null,
    children: [
      {
        id: 31,
        name: '报告审核',
        code: 'report.review',
        parentId: 3,
        children: [{ id: 311, name: '审核', code: 'report.review.audit', parentId: 31 }],
      },
      {
        id: 32,
        name: '报告签发',
        code: 'report.issue',
        parentId: 3,
        children: [{ id: 321, name: '签发', code: 'report.issue.approve', parentId: 32 }],
      },
    ],
  },
]

function collectLeafCodes(nodes: PermissionNode[]): string[] {
  const codes: string[] = []
  const walk = (list: PermissionNode[]): void => {
    list.forEach((node) => {
      if (node.children && node.children.length) {
        walk(node.children)
      } else {
        codes.push(node.code)
      }
    })
  }
  walk(nodes)
  return codes
}

const ALL_PERMISSION_CODES = collectLeafCodes(permissionTreeMock)

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  '超级管理员': ALL_PERMISSION_CODES,
  '管理员': [
    'system.account.create',
    'system.account.edit',
    'system.account.delete',
    'system.client.create',
    'system.client.edit',
    'system.client.delete',
    'trial.commission.create',
    'trial.commission.edit',
    'trial.commission.delete',
    'trial.testitem.create',
    'trial.testitem.edit',
  ],
  '试验员': [
    'trial.commission.create',
    'trial.commission.edit',
    'trial.testitem.create',
    'trial.testitem.edit',
  ],
  '审核员': ['report.review.audit'],
  '报告员': ['report.issue.approve'],
}

interface AccountRecord extends AccountItem {
  permission_codes: string[]
}

export async function getAccountList(
  query: AccountQuery
): Promise<AccountListResult> {
  const { data } = await http.get<{
    items: AccountRecord[]
    total: number
    page: number
    page_size: number
  }>('/api/store/account', { params: query })
  return {
    items: data.items,
    total: data.total,
    page: data.page,
    page_size: data.page_size,
  }
}

export async function createAccount(
  payload: AccountPayload
): Promise<AccountItem> {
  const { permissionCodes, ...account } = payload
  const { data } = await http.post<AccountRecord>('/api/store/account', {
    ...account,
    status: 'enabled',
    permission_codes: permissionCodes,
  })
  return data
}

export async function updateAccount(
  id: number,
  payload: AccountPayload
): Promise<AccountItem> {
  const { permissionCodes, ...account } = payload
  const { data } = await http.put<AccountRecord>(`/api/store/account/${id}`, {
    ...account,
    permission_codes: permissionCodes,
  })
  return data
}

export async function deleteAccount(id: number): Promise<void> {
  await http.delete(`/api/store/account/${id}`)
}

export async function resetAccountPassword(
  _id: number,
  _newPassword: string
): Promise<void> {
  // 账户密码不在当前账户数据模型中，暂不落库。
  return Promise.resolve()
}

export async function toggleAccountStatus(
  id: number,
  status: AccountStatus
): Promise<AccountItem> {
  const { data } = await http.put<AccountRecord>(`/api/store/account/${id}`, {
    status,
  })
  return data
}

export async function getPermissionTree(): Promise<PermissionNode[]> {
  return permissionTreeMock
}

export async function getRolePermissions(roles: Role[]): Promise<string[]> {
  const set = new Set<string>()
  roles.forEach((role) => {
    ROLE_PERMISSIONS[role].forEach((code) => set.add(code))
  })
  return Array.from(set)
}

export async function getAccountPermissions(
  accountId: number
): Promise<string[]> {
  const { data } = await http.get<AccountRecord>(`/api/store/account/${accountId}`)
  return data.permission_codes ?? []
}