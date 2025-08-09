import { useAuthStore } from '../store/authStore.supabase';

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