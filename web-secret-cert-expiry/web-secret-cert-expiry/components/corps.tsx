"use client";

import React, { useRef, useEffect, useState } from 'react';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import LoginConfig from './auth';

const Corps: React.FC = () => {
    const [isAuth, setIsAuth] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);
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
            fetchApplications(); // Fetch applications after login
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const fetchApplications = async () => {
        if (!publicClientAppRef.current) return;

        const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(publicClientAppRef.current, {
            account: publicClientAppRef.current.getAllAccounts()[0],
            scopes: ["Directory.Read.All"],
            interactionType: InteractionType.Popup,
        });

        const client = Client.initWithMiddleware({ authProvider });

        try {
            const response = await client.api('/applications').get();
            setApplications(response.value);
            await fetchCertificatesAndSecrets(client, response.value); // Fetch certificates and secrets after fetching applications
        } catch (error) {
            console.error("Fetching applications failed", error);
        }
    };

    const fetchCertificatesAndSecrets = async (client: Client, applications: any[]) => {
        try {
            const promises = applications.map(async (app) => {
            
            const secrets = await client.api(`/applications/${app.id}/passwordCredentials`).get();
            const certificateCredentials = await client.api(`/applications/${app.id}/keyCredentials`).get();
            const certificateCredentialsWithDetails = await Promise.all(certificateCredentials.value.map(async (credential: any) => {
                const credentialDetails = await client.api(`/applications/${app.id}/keyCredentials/`).get();
                return {
                ...credential,
                displayName: credentialDetails.displayName,
                endDateTime: credentialDetails.endDateTime,
                };
            }));
            const passwordCredentials = await client.api(`/applications/${app.id}/passwordCredentials`).get();
            const passwordCredentialsWithDetails = await Promise.all(passwordCredentials.value.map(async (credential: any) => {
                const credentialDetails = await client.api(`/applications/${app.id}/passwordCredentials/`).get();
                return {
                ...credential,
                displayName: credentialDetails.displayName,
                endDateTime: credentialDetails.endDateTime,
                };
            }));
    
            return {
                ...app,
                secrets: secrets.value,
                passwordCredentials: passwordCredentialsWithDetails,
            };
            });
            const results = await Promise.all(promises);
            setApplications(results);
        } catch (error) {
            console.error("Fetching certificates and secrets failed", error);
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
            <div className="text-lg mx-20 ">
                <div className=" flex justify-between items-center bg-cyan-500 text-black text-center rounded p-4 mx-auto mt-10 mb-10" >
                    <h1>Secrets / Certificats</h1>
                    <select>
                        <option value="secrets">Secrets</option>
                        <option value="certificates">Certificates</option>
                    </select>
                <input type="number" placeholder="Days to expiry" />
                </div>
                {isAuth ? (
                    <div>
                        <h1 className="bg-lime-200">User is authenticated</h1>

                        <h2>Secrets:</h2>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border border-blue-600 px-4 py-2">Application Name</th>
                                    <th className="border border-blue-600 px-4 py-2">Secret Name</th>
                                    <th className="border border-blue-600 px-4 py-2">Secret End Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications?.length > 0 ? (
                                    applications.map((app) => (
                                        <tr key={app.id}>
                                            <td className="border border-blue-600 px-4 py-2">{app.displayName}</td>
                                            <td className="border border-blue-600 px-4 py-2">
                                                {app.secrets?.length > 0 ? (
                                                    app.secrets.map((secret: any) => (
                                                        <div key={secret.id}>
                                                            <p>{secret.displayName}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p>No secrets found</p>
                                                )}
                                            </td>
                                            <td className="border border-blue-600 px-4 py-2">
                                                {app.secrets?.length > 0 ? (
                                                    app.secrets.map((secret: any) => (
                                                        <div key={secret.id}>
                                                            <p>{secret.endDateTime}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p>No secrets found</p>
                                                )}
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="border border-blue-600 px-4 py-2" colSpan={3}>No applications found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <h1>User is not authenticated</h1>
                )}
            </div>
        </div>
    );
};
export default Corps;
