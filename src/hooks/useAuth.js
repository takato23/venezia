import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    checkAuth,
    logout
  };
};