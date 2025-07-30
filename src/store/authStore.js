import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const authStore = create(
  persist(
    (set, get) => ({
      // Estado
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sidebarOpen: true,
      darkMode: false,

      // Acciones
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await axios.post('/api/auth/login', credentials);
          const { user, token } = response.data;
          
          // Configurar axios con el token
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data?.message || 'Error de autenticación'
          };
        }
      },

      logout: async () => {
        try {
          await axios.post('/api/auth/logout');
        } catch (error) {
          console.error('Error en logout:', error);
        } finally {
          // Limpiar estado y token
          delete axios.defaults.headers.common['Authorization'];
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        
        try {
          // Probar primero con el endpoint que funciona
          const response = await axios.get('/api/auth/check');
          
          if (response.data.authenticated) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error verificando autenticación:', error);
          
          // En desarrollo, permitir acceso sin autenticación para testing
          if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
            console.warn('⚠️ Backend no disponible, usando modo desarrollo');
            set({
              user: { 
                id: 1, 
                username: 'dev', 
                name: 'Modo Desarrollo',
                email: 'dev@venezia.com'
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // En producción, intentar fallback
            try {
              const response = await axios.get('/api/auth/me');
              set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false,
              });
            } catch (fallbackError) {
              console.error('Fallback auth check falló:', fallbackError);
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          }
        }
      },

      // UI actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setDarkMode: (dark) => {
        set({ darkMode: dark });
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      toggleDarkMode: () => {
        const newDarkMode = !get().darkMode;
        get().setDarkMode(newDarkMode);
      },

      // Actualizar perfil de usuario
      updateUser: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await axios.put('/api/auth/profile', userData);
          set({
            user: response.data.user,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data?.message || 'Error actualizando perfil'
          };
        }
      },
    }),
    {
      name: 'venezia-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sidebarOpen: state.sidebarOpen,
        darkMode: state.darkMode,
      }),
    }
  )
);

// Configurar interceptor de axios para manejar errores de autenticación
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      authStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const useAuthStore = authStore; 