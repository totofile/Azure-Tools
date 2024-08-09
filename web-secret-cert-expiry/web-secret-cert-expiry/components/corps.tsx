"use client";

import React, { useRef, useEffect, useState } from 'react';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import LoginConfig from './auth';
import { formatDate, calculateDaysToExpiry } from './dateUtils';
import { fetchApplications, fetchSecrets, fetchCertificates } from './applicationService';

const Corps: React.FC = () => {
    const [isAuth, setIsAuth] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [daysToExpiry, setDaysToExpiry] = useState<number>(5000);
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
            handleFetchApplications(); // Fetch applications after login
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleFetchApplications = async () => {
        if (!publicClientAppRef.current) return;

        const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(publicClientAppRef.current, {
            account: publicClientAppRef.current.getAllAccounts()[0],
            scopes: ["Directory.Read.All"],
            interactionType: InteractionType.Popup,
        });

        const client = Client.initWithMiddleware({ authProvider });

        try {
            const applications = await fetchApplications(client);
            const [appsWithSecrets, appsWithCertificates] = await Promise.all([
                fetchSecrets(client, applications),
                fetchCertificates(client, applications)
            ]);

            const mergedApplications = applications.map((app: any) => {
                const appWithSecrets = appsWithSecrets.find((a: any) => a.id === app.id) || {};
                const appWithCertificates = appsWithCertificates.find((a: any) => a.id === app.id) || {};
                return {
                    ...app,
                    secrets: appWithSecrets.secrets || [],
                    certificates: appWithCertificates.certificates || []
                };
            });

            setApplications(mergedApplications);
        } catch (error) {
            console.error("Fetching applications failed", error);
        }
    };

    const filteredApplications = applications.filter(app => app.secrets?.length > 0 || app.certificates?.length > 0).map(app => {
        const filteredSecrets = app.secrets?.filter((secret: any) => calculateDaysToExpiry(secret.endDateTime) <= daysToExpiry) || [];
        const filteredCertificates = app.certificates?.filter((cert: any) => calculateDaysToExpiry(cert.endDateTime) <= daysToExpiry) || [];

        return { ...app, secrets: filteredSecrets, certificates: filteredCertificates };
    });

    return (
        <div>
            <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h1 className="text-xl">My App Header</h1>
                <button onClick={login} className="bg-white text-blue-600 p-2 rounded">
                    {isAuth ? "Logged In" : "Login"}
                </button>
            </header>
            <div className="text-lg mx-20">
                <div className="flex justify-between items-center bg-cyan-500 text-black text-center rounded p-4 mx-auto mt-10 mb-10">
                    <h1>Secrets / Certificats</h1>
                    <button onClick={handleFetchApplications}>Fetch Applications</button>
                    <select onChange={(e) => setSelectedType(e.target.value)} value={selectedType}>
                        <option value="all">All</option>
                        <option value="secrets">Secrets</option>
                        <option value="certificates">Certificates</option>
                    </select>
                    <input type="number" placeholder='Days to expiry : 30' onChange={(e) => setDaysToExpiry(Number(e.target.value))} />
                </div>
                <div>
                    {filteredApplications.length > 0 ? (
                        <table className="w-full text-xl text-left">
                            <thead className='text-sm text-gray-700 uppercase'>
                                <tr>
                                    <th scope="col" className="border border-gray-700 px-6 py-3 bg-gray-50">Application Name</th>
                                    <th scope="col" className="border border-gray-700 px-6 py-3">{selectedType === 'all' ? 'Display Name' : selectedType === 'secrets' ? 'Secret Display Name' : 'Certificate Display Name'}</th>
                                    <th scope="col" className="border border-gray-700 px-6 py-3 bg-gray-50">End Date</th>
                                    <th scope="col" className="border border-gray-700 px-6 py-3">Days To Expiry</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApplications.map((app) => (
                                    <tr key={app.id}>
                                        <td scope="col" className="border border-gray-700 py-3 bg-gray-50 text-left p-5">{app.displayName}</td>
                                        <td className="border border-gray-700 p-5">
                                            {selectedType === 'secrets' || selectedType === 'all' ? (
                                                app.secrets && app.secrets.length > 0 ? (
                                                    app.secrets.map((secret: any) => (
                                                        <div className="border-gray-700" key={secret.keyId}>
                                                            <p>{secret.displayName}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    null
                                                )
                                            ) : null}
                                            {selectedType === 'certificates' || selectedType === 'all' ? (
                                                app.certificates && app.certificates.length > 0 ? (
                                                    app.certificates.map((cert: any) => (
                                                        <div className="border-gray-700" key={cert.keyId}>
                                                            <p>{cert.displayName}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    null
                                                )
                                            ) : null}
                                        </td>
                                        <td scope="col" className="border border-gray-700 py-3 bg-gray-50 p-5">
                                            {selectedType === 'secrets' || selectedType === 'all' ? (
                                                app.secrets && app.secrets.length > 0 ? (
                                                    app.secrets.map((secret: any) => (
                                                        <div className="border-gray-700" key={secret.keyId}>
                                                            <p>{formatDate(secret.endDateTime)}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    null
                                                )
                                            ) : null}
                                            {selectedType === 'certificates' || selectedType === 'all' ? (
                                                app.certificates && app.certificates.length > 0 ? (
                                                    app.certificates.map((cert: any) => (
                                                        <div className="border-gray-700" key={cert.keyId}>
                                                            <p>{formatDate(cert.endDateTime)}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    null
                                                )
                                            ) : null}
                                        </td>
                                        <td scope="col" className="border border-gray-700 py-3 p-5">
                                            {selectedType === 'secrets' || selectedType === 'all' ? (
                                                app.secrets && app.secrets.length > 0 ? (
                                                    app.secrets.map((secret: any) => (
                                                        <div className="border-gray-700" key={secret.keyId}>
                                                            <p>{calculateDaysToExpiry(secret.endDateTime)}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    null
                                                )
                                            ) : null}
                                            {selectedType === 'certificates' || selectedType === 'all' ? (
                                                app.certificates && app.certificates.length > 0 ? (
                                                    app.certificates.map((cert: any) => (
                                                        <div className="border-gray-700" key={cert.keyId}>
                                                            <p>{calculateDaysToExpiry(cert.endDateTime)}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    null
                                                )
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <h1>User is not authenticated</h1>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Corps;