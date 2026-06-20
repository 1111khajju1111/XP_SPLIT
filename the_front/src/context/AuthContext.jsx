import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('xpsplit_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const [currentGroup, setCurrentGroup] = useState(() => {
    try {
      const stored = localStorage.getItem('xpsplit_group')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('xpsplit_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setCurrentGroup(null)
    localStorage.removeItem('xpsplit_user')
    localStorage.removeItem('xpsplit_group')
  }

  const selectGroup = (group) => {
    setCurrentGroup(group)
    localStorage.setItem('xpsplit_group', JSON.stringify(group))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, currentGroup, selectGroup }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
