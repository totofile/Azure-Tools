"use client";
import React, { useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useAuth } from './authContext';
import useFetchData from '../hooks/useFetchData';
import { formatDate } from './dateUtils';

const Corps: React.FC = () => {
  const { login, isAuth } = useAuth();
  const { rowData, daysToExpiry, setDaysToExpiry } = useFetchData();

  useEffect(() => {
    if (isAuth) {
      console.log("User is authenticated, fetching data...");
    }
  }, [isAuth]);

  const getColumnDefs = () => {
    return [
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
      },
      {
        headerName: "Type",
        field: "type",
        flex: 1,
        resizable: true,
        sortable: true,
        filter: 'agTextColumnFilter'
      }
    ];
  };

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