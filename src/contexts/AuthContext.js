import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

// --- TYPES D'ACTIONS ---
const AUTH_ACTIONS = {
  LOGIN_START:    'LOGIN_START',
  LOGIN_SUCCESS:  'LOGIN_SUCCESS',
  LOGIN_FAILURE:  'LOGIN_FAILURE',
  LOGOUT:         'LOGOUT',
  LOAD_USER:      'LOAD_USER',
  CLEAR_ERROR:    'CLEAR_ERROR'
};

// --- ÉTAT INITIAL ---
const initialState = {
  token:           localStorage.getItem('token'),
  user:            null,
  isAuthenticated: false,
  isLoading:       false,
  error:           null
};

// --- RÉDUCTEUR ---
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return { ...state, isLoading: true, error: null };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        token:           action.payload.token,
        user:            action.payload.user,
        isAuthenticated: true,
        isLoading:       false,
        error:           null
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        token:           null,
        user:            null,
        isAuthenticated: false,
        isLoading:       false,
        error:           action.payload
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        token:           null,
        user:            null,
        isAuthenticated: false,
        isLoading:       false,
        error:           null
      };
    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user:            action.payload,
        isAuthenticated: true,
        isLoading:       false
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
}

// --- CONTEXTE ---
const AuthContext = createContext();

// --- PROVIDER ---
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const tokenRef = useRef(state.token);
  const location = useLocation();
  const navigate = useNavigate();

  // Liste des routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/email-sent',
    '/email-verify',
    '/'
  ];

  useEffect(() => {
    tokenRef.current = state.token;
  }, [state.token]);

  // Vérifier si l'utilisateur est authentifié pour les routes protégées
  useEffect(() => {
    const isResetPasswordPage = location.pathname === '/reset-password';
    
    if (isResetPasswordPage) {
      return;
    }
    
    const isPublicRoute = publicRoutes.some(route => 
      location.pathname === route || 
      location.pathname.startsWith('/email-verify/') ||
      location.pathname.startsWith('/api/auth/verify/')
    );

    if (!isPublicRoute && !state.isAuthenticated && !state.isLoading && state.token === null) {
      navigate('/login');
    }
  }, [state.isAuthenticated, state.isLoading, state.token, location.pathname, navigate]);

  //  CORRECTION CRITIQUE : Charge le profil complet depuis /api/auth/me
  const loadUser = useCallback(async () => {
    if (!tokenRef.current) return;
    
    try {
      console.log("🔄 Loading user from /api/auth/me");
      
      const res = await api.get('/api/auth/me');
      
      console.log("📥 Response from /api/auth/me:", res.data);
      
      if (res.data.success) {
        const full = res.data.data;
        
        console.log("📦 Full user data:", full);
        
        //  CRITICAL: Convertir _id en string si c'est un ObjectId
        const userId = full.id || 
                      (full._id?.toString ? full._id.toString() : full._id) || 
                      full._id;
        
        console.log("🆔 Extracted user ID:", userId, "Type:", typeof userId);
        
        //  Construire l'objet utilisateur avec ID en string
        const userData = {
          ...full,
          id: userId, //  ID en string pour comparaison
          _id: userId //  _id aussi en string
        };
        
        console.log(" User data prepared:", {
          id: userData.id,
          _id: userData._id,
          email: userData.email,
          role: userData.role
        });
        
        dispatch({ type: AUTH_ACTIONS.LOAD_USER, payload: userData });
      }
    } catch(err) {
      console.error("❌ Error loading user:", err);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    }
  }, []);

  // Configure l'en-tête d'autorisation
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common.Authorization = `Bearer ${state.token}`;
      loadUser();
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [state.token, loadUser]);

  //  CORRECTION : Login avec conversion d'ID
  const login = (token, partialUser) => {
    console.log(" Login called with:", { token: token ? "Present" : "Absent", partialUser });
    
    localStorage.setItem('token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    
    //  Convertir l'ID aussi au login
    const userId = partialUser.id || 
                  (partialUser._id?.toString ? partialUser._id.toString() : partialUser._id) || 
                  partialUser._id;
    
    const userWithId = {
      ...partialUser,
      id: userId,
      _id: userId
    };
    
    console.log(" User at login:", userWithId);
    
    dispatch({
      type: AUTH_ACTIONS.LOGIN_SUCCESS,
      payload: { token, user: userWithId }
    });
    
    loadUser();
  };

  const logout = async () => {
    try {
      if (state.token) {
        await api.post('/api/auth/logout');
      }
    } catch (err) {
      console.error('Erreur logout:', err);
    } finally {
      localStorage.removeItem('token');
      delete api.defaults.headers.common.Authorization;
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const startLogin = () => dispatch({ type: AUTH_ACTIONS.LOGIN_START });
  const setError = err => dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: err });
  const clearError = () => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

  const setUser = (user) => {
    //  Aussi convertir l'ID quand on set manuellement l'user
    const userId = user.id || 
                  (user._id?.toString ? user._id.toString() : user._id) || 
                  user._id;
    
    const userWithId = {
      ...user,
      id: userId,
      _id: userId
    };
    
    dispatch({ type: AUTH_ACTIONS.LOAD_USER, payload: userWithId });
  };

  //  Log pour surveiller l'état utilisateur
  useEffect(() => {
    console.log(" Auth state changed:", {
      isAuthenticated: state.isAuthenticated,
      userId: state.user?.id,
      userEmail: state.user?.email
    });
  }, [state.user, state.isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      token:           state.token,
      user:            state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading:       state.isLoading,
      error:           state.error,
      login,
      logout,
      loadUser,
      startLogin,
      setError,
      clearError,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default AuthContext;