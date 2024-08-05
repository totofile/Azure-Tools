"use client";

import React, { useRef, useEffect, useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import LoginConfig from './auth';

const Corps: React.FC = () => {
    const [isAuth, setIsAuth] = useState(false);

  const publicClientAppRef = useRef<PublicClientApplication | null>(null);

  useEffect(() => {
    const initializeMsal = async () => {
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
    };

    initializeMsal().catch((error) => {
      console.error("MSAL initialization failed", error);
    });
  }, []);

  const login = async () => {
    console.log("Login button clicked");
    try {
      await publicClientAppRef.current?.loginPopup();
      console.log("Login successful");
      setIsAuth(true);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

    return (
        <div>
            <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h1 className="text-xl">My App Header</h1>
                <button onClick={login} className="bg-white text-blue-600 p-2 rounded">
                    {isAuth ? "Logged In" : "Login"}
                </button>
            </header>
            <div>
                {isAuth ? <h1>User is authenticated</h1> : <h1>User is not authenticated</h1>}
            </div>
        </div>
    );
};

export default Corps;
