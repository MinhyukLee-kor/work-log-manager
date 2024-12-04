interface UserSession {
  username: string;
  nickname: string;
  role: string;
  rights: string;
  duty: string;
  userId: number;
  home: string;
}

export const setSession = (data: UserSession) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(data))
  }
}

export const getSession = (): UserSession | null => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }
  return null
}

export const clearSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
  }
}

export const isAuthenticated = (): boolean => {
  return getSession() !== null
} 