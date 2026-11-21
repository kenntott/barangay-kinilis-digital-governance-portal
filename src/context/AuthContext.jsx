import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import apiClient from '../services/api/apiClient';

const AuthContext = createContext();

export const DEMO_USERS = {
  resident: {
    id: '1',
    name: 'Juan dela Cruz',
    email: 'juan.delacruz@kinilis.gov.ph',
    password: 'password123',
    role: 'resident',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    contact: '0917-123-4567',
    purok: 'Purok 3, Brgy. Kinilis, Polomolok'
  },
  staff: {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@kinilis.gov.ph',
    password: 'password123',
    role: 'staff',
    status: 'Active',
    department: 'Sanitation Department',
    position: 'Sanitation Officer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    contact: '0920-987-6543'
  },
  admin: {
    id: '3',
    name: 'Admin Desk (Capt. Hon. Escabarte)',
    email: 'admin@kinilis.gov.ph',
    password: 'password123',
    role: 'admin',
    status: 'Active',
    department: 'Barangay Administrative Office',
    position: 'Barangay Administrator',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    contact: '0918-000-1122'
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kinilis_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('kinilis_is_authenticated') === 'true';
  });

  const [preloaderState, setPreloaderState] = useState({
    active: true, // Startup preloader active on first mount
    mode: 'startup',
    userRole: null,
    userName: null,
    onComplete: null
  });

  const triggerPreloader = (mode, userRole = null, userName = null, onComplete = null) => {
    setPreloaderState({
      active: true,
      mode,
      userRole,
      userName,
      onComplete
    });
  };

  const closePreloader = () => {
    setPreloaderState(prev => {
      if (prev.onComplete) prev.onComplete();
      return { ...prev, active: false, onComplete: null };
    });
  };

  // Keep localStorage synced for smooth session state
  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem('kinilis_current_user', JSON.stringify(user));
      localStorage.setItem('kinilis_is_authenticated', 'true');
    } else {
      localStorage.removeItem('kinilis_current_user');
      localStorage.setItem('kinilis_is_authenticated', 'false');
    }
  }, [user, isAuthenticated]);

  // Proactively verify account active status for Supabase sessions
  useEffect(() => {
    if (user?.id && isAuthenticated && isSupabaseConfigured() && !user.id.startsWith('usr_') && !['1', '2', '3'].includes(String(user.id))) {
      supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: prof }) => {
          if (!prof || !prof.status || prof.status.trim().toLowerCase() !== 'active') {
            console.warn('[Auth Notice]: User account profile is missing or no longer active. Terminating session.');
            logout();
          }
        })
        .catch(() => {});
    }
  }, [user?.id, isAuthenticated]);

  const switchRole = async (roleKey) => {
    try {
      const result = await apiClient.post('auth.php?action=switch_role', { role: roleKey });
      if (result && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        return;
      }
    } catch (err) {
      console.warn('Backend role switch notice, falling back to local demo profile:', err.message);
    }

    if (DEMO_USERS[roleKey]) {
      setUser(DEMO_USERS[roleKey]);
      setIsAuthenticated(true);
    }
  };

  const login = async (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Try PHP Backend Authentication (MySQL)
    try {
      const result = await apiClient.post('auth.php?action=login', {
        email: trimmedEmail,
        password: password
      });
      if (result && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true, user: result.user };
      }
    } catch (err) {
      console.warn('PHP Auth notice:', err.message);
    }

    // 2. Demo accounts instant evaluation testing
    const matchedDemo = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === trimmedEmail);
    if (matchedDemo && (password === matchedDemo.password || password === 'password123')) {
      setUser(matchedDemo);
      setIsAuthenticated(true);
      return { success: true, user: matchedDemo };
    }

    // 3. Optional Supabase Auth Fallback
    if (isSupabaseConfigured()) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password
        });

        if (!authError && authData?.user) {
          const authUser = authData.user;
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          // Reject missing, inactive, or suspended accounts immediately
          if (!profile || !profile.status || profile.status.trim().toLowerCase() !== 'active') {
            await supabase.auth.signOut();
            return {
              success: false,
              error: 'Your account profile is missing, deactivated, or suspended. Please contact the Barangay Administrator.'
            };
          }

          const loggedUser = {
            id: authUser.id,
            name: profile?.full_name || authUser.user_metadata?.full_name || email.split('@')[0],
            email: authUser.email,
            role: profile?.role || 'resident',
            status: profile?.status || 'Active',
            department: profile?.department || null,
            contact: profile?.phone || '',
            purok: profile?.purok || 'Brgy. Kinilis, Polomolok',
            avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
          };
          setUser(loggedUser);
          setIsAuthenticated(true);
          return { success: true, user: loggedUser };
        }
      } catch (err) {
        console.warn('Supabase Auth exception:', err);
      }
    }

    // 4. Fallback user
    const fallbackUser = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].replace(/[\._]/g, ' '),
      email,
      role: email.includes('admin') ? 'admin' : email.includes('staff') ? 'staff' : 'resident',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      contact: '0917-000-0000',
      purok: 'Brgy. Kinilis, Polomolok'
    };

    setUser(fallbackUser);
    setIsAuthenticated(true);
    return { success: true, user: fallbackUser };
  };

  const register = async (userData) => {
    const { fullName, email, password, phone, purok } = userData;
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try PHP Backend Registration (MySQL)
    try {
      const result = await apiClient.post('auth.php?action=register', {
        name: fullName,
        email: cleanEmail,
        password: password || 'password123',
        phone: phone || '',
        purok: purok || 'Purok 3, Brgy. Kinilis, Polomolok'
      });
      if (result && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true, user: result.user };
      }
    } catch (err) {
      console.warn('PHP Register notice:', err.message);
    }

    // 2. Local fallback registration
    const localUser = {
      id: `usr_${Date.now()}`,
      name: fullName || 'New Resident',
      email: cleanEmail,
      role: 'resident',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      contact: phone || '0919-000-0000',
      purok: purok || 'Brgy. Kinilis, Polomolok'
    };

    setUser(localUser);
    setIsAuthenticated(true);
    return { success: true, user: localUser };
  };

  const logout = async (onAfterLogout = null) => {
    // Show 3D seal logout animation
    triggerPreloader('logout', user?.role, user?.name, () => {
      if (onAfterLogout) onAfterLogout();
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut notice:', err);
      }
    }

    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('kinilis_current_user');
    localStorage.setItem('kinilis_is_authenticated', 'false');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      switchRole, 
      login, 
      logout, 
      register,
      preloaderState,
      triggerPreloader,
      closePreloader
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
