import React, { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError, InteractionType } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import LoginConfig from './auth';

interface BodyProps {
  isAuth: boolean;
}

const Body: React.FC<BodyProps> = ({ isAuth }) => {
  const [enterpriseApps, setEnterpriseApps] = useState<any[]>([]);
  const { instance, accounts } = useMsal();

  useEffect(() => {
    if (isAuth && accounts.length > 0) {
      const fetchEnterpriseApps = async () => {
        try {
          const account = accounts[0];
          const response = await instance.acquireTokenSilent({
            scopes: ['Application.Read.All'],
            account,
          });

          const authProvider = new AuthCodeMSALBrowserAuthenticationProvider({
            msalConfig: LoginConfig,
            interactionType: InteractionType.Popup,
          }, {
            account,
            scopes: ['Application.Read.All'],
          });

          const client = Client.initWithMiddleware({ authProvider });
          const result = await client.api('/servicePrincipals').get();

          setEnterpriseApps(result.value);
        } catch (error) {
          if (error instanceof InteractionRequiredAuthError) {
            instance.acquireTokenPopup({
              scopes: ['Application.Read.All'],
            }).then(response => {
              const authProvider = new AuthCodeMSALBrowserAuthenticationProvider({
                msalConfig: LoginConfig,
                interactionType: InteractionType.Popup,
              }, {
                account: accounts[0],
                scopes: ['Application.Read.All'],
              });

              const client = Client.initWithMiddleware({ authProvider });
              client.api('/servicePrincipals').get().then(result => {
                setEnterpriseApps(result.value);
              });
            });
          } else {
            console.error('Error fetching enterprise applications', error);
          }
        }
      };

      fetchEnterpriseApps();
    }
  }, [isAuth, accounts, instance]);

  return (
    <div>
      <h1>Enterprise Applications</h1>
      {isAuth ? (
        <ul>
          {enterpriseApps.map(app => (
            <li key={app.id}>{app.displayName}</li>
          ))}
        </ul>
      ) : (
        <p>Please log in to see the enterprise applications.</p>
      )}
    </div>
  );
};

export default Body;