"use client";
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { PublicClientApplication, AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import LoginConfig from './auth';

type AuthContextType = {
  isAuth: boolean;
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuth, setIsAuth] = useState(false);
  const publicClientAppRef = useRef<PublicClientApplication | null>(null);
  const accountRef = useRef<AccountInfo | null>(null);

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
                    storeAuthStateInCookie: true,
                },
            });
            await publicClientAppRef.current.initialize();
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

  const logout = () => {
    if (publicClientAppRef.current) {
      publicClientAppRef.current.logoutPopup();
      accountRef.current = null;
      setIsAuth(false);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (publicClientAppRef.current && accountRef.current) {
      try {
        const response: AuthenticationResult = await publicClientAppRef.current.acquireTokenSilent({
          scopes: ["Directory.Read.All"],
          account: accountRef.current,
        });
        return response.accessToken;
      } catch (error) {
        console.error("Token acquisition failed", error);
        try {
          const response: AuthenticationResult = await publicClientAppRef.current.acquireTokenPopup({
            scopes: ["Directory.Read.All"],
            account: accountRef.current,
          });
          return response.accessToken;
        } catch (popupError) {
          console.error("Token acquisition via popup failed", popupError);
          return null;
        }
      }
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ isAuth, login, logout, getAccessToken }}>
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