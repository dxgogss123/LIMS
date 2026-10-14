// 委托人管理接口封装（对应 client 表，路径 /api/store/client）。

import http from './http'

export const POSITION_OPTIONS = ['研发工程师', '评价工程师'] as const

export interface ClientItem {
  id: number
  name: string
  phone: string
  department: string
  position: string
}

export interface ClientQuery {
  page: number
  page_size: number
  keyword?: string
}

export interface ClientListResult {
  items: ClientItem[]
  total: number
  page: number
  page_size: number
}

export interface ClientPayload {
  name: string
  phone: string
  department: string
  position: string
}

export async function getClientList(
  query: ClientQuery
): Promise<ClientListResult> {
  const { data } = await http.get<ClientListResult>('/api/store/client', {
    params: query,
  })
  return data
}

export async function createClient(
  payload: ClientPayload
): Promise<ClientItem> {
  const { data } = await http.post<ClientItem>('/api/store/client', payload)
  return data
}

export async function updateClient(
  id: number,
  payload: ClientPayload
): Promise<ClientItem> {
  const { data } = await http.put<ClientItem>(`/api/store/client/${id}`, payload)
  return data
}

export async function deleteClient(id: number): Promise<void> {
  await http.delete(`/api/store/client/${id}`)
}