import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ---- User ----
export const registerUser = (data) => api.post('/users/register', data)
export const loginUser    = (data) => api.post('/users/login', data)
export const getUser      = (id)   => api.get(`/users/${id}`)
export const updateUser   = (id, data) => api.put(`/users/${id}`, data)
export const updatePhoto  = (id, profilePhotoUrl) => api.put(`/users/${id}/photo`, { profilePhotoUrl })

// ---- Groups ----
export const createGroup    = (data)        => api.post('/groups', data)
export const joinGroup      = (data)        => api.post('/groups/join', data)
export const getGroup       = (id)          => api.get(`/groups/${id}`)
export const getUserGroups  = (userId)      => api.get(`/groups/user/${userId}`)
export const getGroupMembers= (id)          => api.get(`/groups/${id}/members`)
export const leaveGroup     = (id, userId)  => api.post(`/groups/${id}/leave`, { userId })
export const deleteGroup    = (id, userId)  => api.delete(`/groups/${id}`, { data: { userId } })
export const regenInviteCode= (id, userId)  => api.post(`/groups/${id}/regenerate-code`, { userId })

// ---- Expenses ----
export const addExpense         = (data)              => api.post('/expenses', data)
export const deleteExpense      = (id)                => api.delete(`/expenses/${id}`)
export const getGroupExpenses   = (groupId)           => api.get(`/expenses/group/${groupId}`)
export const getExpensesByDate  = (groupId, start, end) => api.get(`/expenses/group/${groupId}/date-range?start=${start}&end=${end}`)

// ---- Balances ----
export const getGroupBalances = (groupId) => api.get(`/balances/group/${groupId}`)
export const getUserBalance   = (groupId, userId) => api.get(`/balances/group/${groupId}/user/${userId}`)

// ---- Settlements ----
export const createSettlement     = (data)    => api.post('/settlements', data)
export const getGroupSettlements  = (groupId) => api.get(`/settlements/group/${groupId}`)

// ---- Analytics ----
export const getGroupAnalytics = (groupId) => api.get(`/analytics/group/${groupId}`)

export default api
