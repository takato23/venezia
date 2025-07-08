import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, supabaseAuth } from '../config/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      darkMode: false,
      sidebarOpen: true,

      // Initialize auth state
      initAuth: async () => {
        try {
          set({ isLoading: true });
          
          // Get current session
          const { session, error } = await supabaseAuth.getSession();
          
          if (error) throw error;
          
          if (session) {
            // Get user profile from our users table
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            set({
              user: profile || session.user,
              session,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      // Login
      login: async (email, password) => {
        try {
          const { data, error } = await supabaseAuth.signIn(email, password);
          
          if (error) throw error;
          
          // Get user profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          set({
            user: profile || data.user,
            session: data.session,
            isAuthenticated: true
          });
          
          return { success: true };
        } catch (error) {
          console.error('Login error:', error);
          return {
            success: false,
            error: error.message || 'Error al iniciar sesión'
          };
        }
      },

      // Logout
      logout: async () => {
        try {
          const { error } = await supabaseAuth.signOut();
          if (error) throw error;
          
          set({
            user: null,
            session: null,
            isAuthenticated: false
          });
          
          // Redirect to login
          window.location.href = '/login';
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      // Update user profile
      updateUser: async (updates) => {
        try {
          const userId = get().user?.id;
          if (!userId) throw new Error('No user logged in');
          
          // Update in Supabase
          const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
          
          if (error) throw error;
          
          // Update local state
          set({ user: data });
          
          return { success: true };
        } catch (error) {
          console.error('Update user error:', error);
          return {
            success: false,
            error: error.message
          };
        }
      },

      // Check auth status
      checkAuth: async () => {
        await get().initAuth();
      },

      // Toggle dark mode
      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }));
      },

      // Set dark mode
      setDarkMode: (darkMode) => {
        set({ darkMode });
      },

      // Toggle sidebar
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      // Set sidebar state
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      // Subscribe to auth changes
      subscribeToAuthChanges: () => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (session) {
                // Get user profile
                const { data: profile } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                set({
                  user: profile || session.user,
                  session,
                  isAuthenticated: true
                });
              }
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                session: null,
                isAuthenticated: false
              });
            }
          }
        );
        
        return subscription;
      }
    }),
    {
      name: 'venezia-auth',
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
);

export { useAuthStore };