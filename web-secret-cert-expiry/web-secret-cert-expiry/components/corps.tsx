"use client";

import React, { useRef, useEffect, useState } from 'react';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
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
    const [selectedType, setSelectedType] = useState<string>('all');
    const [daysToExpiry, setDaysToExpiry] = useState<number>(30);
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
            fetchData(); // Fetch data after login
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const fetchData = async () => {
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

            const flattenedData = flattenData(applications, appsWithSecrets, appsWithCertificates);
            setRowData(flattenedData);
        } catch (error) {
            console.error("Fetching data failed", error);
        }
    };

    const flattenData = (applications: any[], appsWithSecrets: any[], appsWithCertificates: any[]) => {
        const flattened: any[] = [];
        applications.forEach(app => {
            const appWithSecrets = appsWithSecrets.find(a => a.id === app.id) || { secrets: [] };
            const appWithCertificates = appsWithCertificates.find(a => a.id === app.id) || { certificates: [] };

            if (selectedType === 'all' || selectedType === 'secrets') {
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
            }

            if (selectedType === 'all' || selectedType === 'certificates') {
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
            }
        });
        return flattened;
    };

    const getColumnDefs = (selectedType: string) => {
        const commonColumns = [
            {
                headerName: "Application Name",
                field: "applicationName",
                sortable: true,
                filter: 'agTextColumnFilter',
                flex: 1,
                resizable: true
            },
            {
                headerName: "Display Name",
                field: "displayName",
                flex: 1,
                resizable: true,
                sortable: true,
                filter: 'agTextColumnFilter'
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
            }
        ];

        if (selectedType === 'all') {
            return [
                ...commonColumns.slice(0, 1),
                {
                    headerName: "Type",
                    field: "type",
                    flex: 1,
                    resizable: true,
                    sortable: true,
                    filter: 'agTextColumnFilter'
                },
                ...commonColumns.slice(1)
            ];
        }

        return commonColumns;
    };

    useEffect(() => {
        fetchData();
    }, [daysToExpiry, selectedType]);

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
                    <select onChange={(e) => setSelectedType(e.target.value)} value={selectedType}>
                        <option value="all">All</option>
                        <option value="secrets">Secrets</option>
                        <option value="certificates">Certificates</option>
                    </select>
                    <div className='flex justify-between items-center'>
                        <p className='mr-5'>Days to Expiry</p>
                        <input className='border rounded' type="number" placeholder='Default: 30' onChange={(e) => setDaysToExpiry(Number(e.target.value))} />
                    </div>
                </div>
                <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={getColumnDefs(selectedType)}
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