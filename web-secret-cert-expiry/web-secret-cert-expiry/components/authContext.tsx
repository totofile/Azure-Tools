// components/authContext.tsx
'use client';
import React, { createContext, useContext, useState, useEffect, useRef, MutableRefObject } from 'react';
import { PublicClientApplication, AuthenticationResult } from '@azure/msal-browser';
import LoginConfig from './auth';

interface AuthContextType {
  isAuth: boolean;
  login: () => Promise<void>;
  logout: () => void;
  publicClientAppRef: MutableRefObject<PublicClientApplication | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const publicClientAppRef = useRef<PublicClientApplication | null>(null);

  useEffect(() => {
    const initializeMsal = async () => {
        try {
            publicClientAppRef.current = new PublicClientApplication({
                auth: {
                    clientId: LoginConfig.clientId,
                    authority: LoginConfig.authority,
                    redirectUri: LoginConfig.redirectUri,
                },
                cache: {
                    cacheLocation: 'sessionStorage',
                    storeAuthStateInCookie: false,
                },
            });
            await publicClientAppRef.current.initialize();

            const accounts = publicClientAppRef.current.getAllAccounts();
            if (accounts.length > 0) {
                setIsAuth(true);
            }
        } catch (error) {
            console.error("MSAL initialization failed", error);
        }
    };

    initializeMsal();
}, []);

const login = async () => {
  console.log("Login button clicked");
  try {
      await publicClientAppRef.current?.loginPopup({
          scopes: ["Directory.Read.All"], // Vérifiez que ces scopes sont les plus restrictifs nécessaires
      });
      console.log("Login successful");
      setIsAuth(true);
  } catch (error) {
      console.error("Login failed", error);
  }
};

const logout = async () => {
  if (publicClientAppRef.current) {
    await publicClientAppRef.current.logoutPopup().catch(err => console.error("Logout failed", err));
    setIsAuth(false);
    publicClientAppRef.current = null; // Réinitialisez la référence de l'application cliente public
    window.location.reload(); // Rechargez la page pour effacer les données de l'utilisateur
  }
};

  return (
    <AuthContext.Provider value={{ isAuth, login, logout, publicClientAppRef }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};