// authContext.tsx
"use client";
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { PublicClientApplication, AuthenticationResult } from '@azure/msal-browser';
import msalConfig from './auth'; // Assuming you have this config file

type AuthContextType = {
  isAuth: boolean;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  publicClientAppRef: React.MutableRefObject<PublicClientApplication | null>;
  login: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuth, setIsAuth] = useState(false);
  const publicClientAppRef = useRef<PublicClientApplication | null>(null);

  useEffect(() => {
    const initializeMsal = async () => {
      publicClientAppRef.current = new PublicClientApplication({
        auth: {
          clientId: msalConfig.clientId,
          authority: msalConfig.authority,
        },
      });
    };

    initializeMsal();
  }, []);

  const login = async () => {
    if (publicClientAppRef.current) {
      try {
        const loginResponse: AuthenticationResult = await publicClientAppRef.current.loginPopup({
          scopes: ["user.read"],
        });
        setIsAuth(true);
        console.log("Login successful:", loginResponse);
      } catch (error) {
        console.error("Login failed:", error);
      }
    }
  };

  const logout = () => {
    if (publicClientAppRef.current) {
      publicClientAppRef.current.logoutPopup();
      setIsAuth(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuth, setIsAuth, publicClientAppRef, login, logout }}>
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
