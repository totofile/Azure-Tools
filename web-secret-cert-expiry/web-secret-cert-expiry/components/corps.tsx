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
    const [applications, setApplications] = useState<any[]>([]);
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

    const filteredApplications = applications
    .map(app => {
        const filteredSecrets = app.secrets?.filter((secret: any) => calculateDaysToExpiry(secret.endDateTime) <= daysToExpiry) || [];
        const filteredCertificates = app.certificates?.filter((cert: any) => calculateDaysToExpiry(cert.endDateTime) <= daysToExpiry) || [];

        return { ...app, secrets: filteredSecrets, certificates: filteredCertificates };
    })
    .filter(app => {
        if (selectedType === 'certificates') {
            return app.certificates.length > 0;
        } else if (selectedType === 'secrets') {
            return app.secrets.length > 0;
        } else if (selectedType === 'all') {
            return app.secrets.length > 0 || app.certificates.length > 0;
        }
        return false;
    });

    const columnDefs = [
        { headerName: "Application Name", field: "displayName", sortable: true, filter: 'agTextColumnFilter', flex: 1, resizable: true },
        {
            headerName: selectedType === 'all' ? 'Display Name' : selectedType === 'secrets' ? 'Secret Display Name' : 'Certificate Display Name',
            field: selectedType === 'secrets' ? 'secrets[0].displayName' : 'certificates[0].displayName',
            flex: 1,
            resizable: true,
            sortable: true,
            filter: 'agTextColumnFilter',
            valueGetter: (params: any) => {
                if (selectedType === 'secrets' || selectedType === 'all') {
                    return params.data.secrets.map((secret: any) => secret.displayName).join(', ');
                } else if (selectedType === 'certificates' || selectedType === 'all') {
                    return params.data.certificates.map((cert: any) => cert.displayName).join(', ');
                }
                return null;
            },
            cellRenderer: (params: any) => {
                if (selectedType === 'secrets' || selectedType === 'all') {
                    return params.data.secrets.map((secret: any) => <div key={secret.keyId}>{secret.displayName}</div>);
                } else if (selectedType === 'certificates' || selectedType === 'all') {
                    return params.data.certificates.map((cert: any) => <div key={cert.keyId}>{cert.displayName}</div>);
                }
                return null;
            }
        },
        {
            headerName: "End Date",
            field: selectedType === 'secrets' ? 'secrets[0].endDateTime' : 'certificates[0].endDateTime',
            flex: 1,
            resizable: true,
            sortable: true,
            filter: 'agDateColumnFilter',
            valueGetter: (params: any) => {
                if (selectedType === 'secrets' || selectedType === 'all') {
                    return params.data.secrets.map((secret: any) => secret.endDateTime).join(', ');
                } else if (selectedType === 'certificates' || selectedType === 'all') {
                    return params.data.certificates.map((cert: any) => cert.endDateTime).join(', ');
                }
                return null;
            },
            valueFormatter: (params: any) => {
                if (selectedType === 'secrets' || selectedType === 'all') {
                    return params.data.secrets.map((secret: any) => formatDate(secret.endDateTime)).join(', ');
                } else if (selectedType === 'certificates' || selectedType === 'all') {
                    return params.data.certificates.map((cert: any) => formatDate(cert.endDateTime)).join(', ');
                }
                return null;
            },
            cellRenderer: (params: any) => {
                if (selectedType === 'secrets' || selectedType === 'all') {
                    return params.data.secrets.map((secret: any) => <div key={secret.keyId}>{formatDate(secret.endDateTime)}</div>);
                } else if (selectedType === 'certificates' || selectedType === 'all') {
                    return params.data.certificates.map((cert: any) => <div key={cert.keyId}>{formatDate(cert.endDateTime)}</div>);
                }
                return null;
            }
        },
        {
            headerName: "Days To Expiry",
            field: selectedType === 'secrets' ? 'secrets[0].endDateTime' : 'certificates[0].endDateTime',
            cellDataType: 'number',
            flex: 1,
            resizable: true,
            sortable: true,
            filter: 'agNumberColumnFilter',
            valueGetter: (params: any) => {
                if (selectedType === 'secrets' || selectedType === 'all') {
                    return params.data.secrets.map((secret: any) => calculateDaysToExpiry(secret.endDateTime)).join(', ');
                } else if (selectedType === 'certificates' || selectedType === 'all') {
                    return params.data.certificates.map((cert: any) => calculateDaysToExpiry(cert.endDateTime)).join(', ');
                }
                return null;
            },
            cellRenderer: (params: any) => {
                if (selectedType === 'secrets' || selectedType === 'all') {
                    return params.data.secrets.map((secret: any) => <div key={secret.keyId}>{calculateDaysToExpiry(secret.endDateTime)}</div>);
                } else if (selectedType === 'certificates' || selectedType === 'all') {
                    return params.data.certificates.map((cert: any) => <div key={cert.keyId}>{calculateDaysToExpiry(cert.endDateTime)}</div>);
                }
                return null;
            }
        }
    ];

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
                    <div className=' flex justify-between items-center '>
                        <p className=' mr-5 '>Days to Expiry</p>
                        <input className=' border rounded ' type="number" placeholder='Default : 30 ' onChange={(e) => setDaysToExpiry(Number(e.target.value))} />
                    </div>
                </div>
                <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                    <AgGridReact
                        rowData={filteredApplications}
                        columnDefs={columnDefs}
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
