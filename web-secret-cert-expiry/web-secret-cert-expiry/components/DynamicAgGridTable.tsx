"use client";
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { fetchApplications, fetchSecrets, fetchCertificates } from './applicationService';
import { calculateDaysToExpiry } from './dateUtils';

const DynamicAgGridTable: React.FC<{ daysToExpiry: number, selectedType: string }> = ({ daysToExpiry, selectedType }) => {
    const [rowData, setRowData] = useState<any[]>([]);
    const [columnDefs] = useState([
        { headerName: 'Application Name', field: 'displayName' },
        { headerName: 'Secret Name', field: 'secretName' },
        { headerName: 'Certificate Name', field: 'certificateName' },
        { headerName: 'Expiry Date', field: 'expiryDate' },
    ]);

    useEffect(() => {
        const fetchData = async () => {
            const applications = await fetchApplications();
            const data = applications.flatMap(app => {
                const secrets = app.secrets?.filter(secret => calculateDaysToExpiry(secret.endDateTime) <= daysToExpiry).map(secret => ({
                    displayName: app.displayName,
                    secretName: secret.displayName,
                    certificateName: '',
                    expiryDate: secret.endDateTime,
                })) || [];
                const certificates = app.certificates?.filter(cert => calculateDaysToExpiry(cert.endDateTime) <= daysToExpiry).map(cert => ({
                    displayName: app.displayName,
                    secretName: '',
                    certificateName: cert.displayName,
                    expiryDate: cert.endDateTime,
                })) || [];
                return [...secrets, ...certificates];
            });
            setRowData(data);
        };

        fetchData();
    }, [daysToExpiry, selectedType]);

    return (
        <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
            />
        </div>
    );
};

export default DynamicAgGridTable;