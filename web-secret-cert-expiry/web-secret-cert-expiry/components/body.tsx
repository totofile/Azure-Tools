"use client";
import React, {useState} from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError, InteractionType } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import LoginConfig  from './auth';

interface BodyProps {
  isAuth2: boolean;
}


const Body: React.FC<BodyProps> = () => {
  const [isAuth2, setIsAuth2] = useState(false);
  return (
    <div>
      {isAuth2 ? <h1>User is authenticated</h1> : <h1>User is not authenticated</h1>}
    </div>
  );
};

export default Body;