"use client";
import React, { useRef, useEffect, useState } from 'react';
import { InteractionType, PublicClientApplication, AuthenticationResult } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import LoginConfig from './auth';
import { formatDate, calculateDaysToExpiry } from './dateUtils';
import { fetchApplications, fetchSecrets, fetchCertificates } from './applicationService';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const Corps: React.FC = () => {
    const [isAuth, setIsAuth] = useState(false);
    const [rowData, setRowData] = useState<any[]>([]);
    const [daysToExpiry, setDaysToExpiry] = useState<number>(30);
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
                        storeAuthStateInCookie: true,
                    },
                });
                await publicClientAppRef.current.initialize();

                const accounts = publicClientAppRef.current.getAllAccounts();
                if (accounts.length > 0) {
                    setIsAuth(true);
                    fetchData();
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
            fetchData(); // Fetch data after login
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const fetchData = async () => {
        if (!publicClientAppRef.current) return;

        const account = publicClientAppRef.current.getAllAccounts()[0];
        if (!account) {
            console.error("No account found");
            return;
        }

        try {
            const response: AuthenticationResult = await publicClientAppRef.current.acquireTokenSilent({
                scopes: ["Directory.Read.All"],
                account: account,
            });

            const accessToken = response.accessToken;
            const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(publicClientAppRef.current, {
                account: account,
                scopes: ["Directory.Read.All"],
                interactionType: InteractionType.Popup,
            });

            const client = Client.initWithMiddleware({ authProvider });

            const applications = await fetchApplications(client);
            const [appsWithSecrets, appsWithCertificates] = await Promise.all([
                fetchSecrets(client, applications),
                fetchCertificates(client, applications)
            ]);

            const flattenedData = flattenData(applications, appsWithSecrets, appsWithCertificates);
            setRowData(flattenedData);
        } catch (error) {
            console.error("Token acquisition failed", error);
            try {
                const response: AuthenticationResult = await publicClientAppRef.current.acquireTokenPopup({
                    scopes: ["Directory.Read.All"],
                    account: account,
                });

                const accessToken = response.accessToken;
                const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(publicClientAppRef.current, {
                    account: account,
                    scopes: ["Directory.Read.All"],
                    interactionType: InteractionType.Popup,
                });

                const client = Client.initWithMiddleware({ authProvider });

                const applications = await fetchApplications(client);
                const [appsWithSecrets, appsWithCertificates] = await Promise.all([
                    fetchSecrets(client, applications),
                    fetchCertificates(client, applications)
                ]);

                const flattenedData = flattenData(applications, appsWithSecrets, appsWithCertificates);
                setRowData(flattenedData);
            } catch (error) {
                console.error("Fetching data failed", error);
            }
        }
    };

    const flattenData = (applications: any[], appsWithSecrets: any[], appsWithCertificates: any[]) => {
        const flattened: any[] = [];
        applications.forEach(app => {
            const appWithSecrets = appsWithSecrets.find(a => a.id === app.id) || { secrets: [] };
            const appWithCertificates = appsWithCertificates.find(a => a.id === app.id) || { certificates: [] };
    
            appWithSecrets.secrets.forEach((secret: any) => {
                if (calculateDaysToExpiry(secret.endDateTime) <= daysToExpiry) {
                    flattened.push({
                        applicationName: app.displayName,
                        type: 'secret',
                        displayName: secret.displayName,
                        endDateTime: secret.endDateTime,
                        daysToExpiry: calculateDaysToExpiry(secret.endDateTime)
                    });
                }
            });
    
            appWithCertificates.certificates.forEach((cert: any) => {
                if (calculateDaysToExpiry(cert.endDateTime) <= daysToExpiry) {
                    flattened.push({
                        applicationName: app.displayName,
                        type: 'certificate',
                        displayName: cert.displayName,
                        endDateTime: cert.endDateTime,
                        daysToExpiry: calculateDaysToExpiry(cert.endDateTime)
                    });
                }
            });
        });
        return flattened;
    };

    const getColumnDefs = () => {
        return [
            {
                headerName: "Secret/Certificate Display Name",
                field: "displayName",
                flex: 1,
                resizable: true,
                sortable: true,
                filter: 'agTextColumnFilter'
            },
            {
                headerName: "Type",
                field: "type",
                flex: 1,
                resizable: true,
                sortable: true,
                filter: 'agTextColumnFilter'
            },
            {
                headerName: "Application Name",
                field: "applicationName",
                sortable: true,
                filter: 'agTextColumnFilter',
                flex: 1,
                resizable: true
            },

            {
                headerName: "End Date",
                field: "endDateTime",
                sortable: true,
                flex: 1,
                resizable: true,
                valueFormatter: (params: any) => formatDate(params.value)
            },
            {
                headerName: "Days To Expiry",
                field: "daysToExpiry",
                cellDataType: 'number',
                flex: 1,
                resizable: true,
                sortable: true,
                filter: 'agNumberColumnFilter'
            },

        ];
    };

    useEffect(() => {
        if (isAuth) {
            fetchData();
        }
    }, [daysToExpiry, isAuth]);

    return (
        <div>
            <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h1 className="text-xl">Azure Application Secret/Certificates Expiry Dashboard</h1>
                <button onClick={login} className="bg-white text-blue-600 p-2 rounded">
                    {isAuth ? "Logged In" : "Login"}
                </button>
            </header>
            <div className="text-lg mx-20">
                <div className="flex justify-between items-center bg-cyan-500 text-black text-center rounded p-4 mx-auto mt-10 mb-10">
                    <div className='flex justify-between items-center'>
                        <p className='mr-5'>Days to Expiry</p>
                        <input className='border rounded' type="number" placeholder='Default: 30' onChange={(e) => setDaysToExpiry(Number(e.target.value))} />
                    </div>
                </div>
                <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={getColumnDefs()}
                        domLayout='autoHeight'
                        pagination={true}
                        paginationPageSize={10}
                    />
                </div>
            </div>
        </div>
    );
};

export default Corps;
