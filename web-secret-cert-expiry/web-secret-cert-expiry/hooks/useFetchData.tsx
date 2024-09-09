import { useEffect, useState } from 'react';
import { Client } from '@microsoft/microsoft-graph-client';
import { useAuth } from '../components/authContext';
import { fetchApplications, fetchSecrets, fetchCertificates } from '../components/applicationService';
import { calculateDaysToExpiry } from '@/components/dateUtils';

const useFetchData = () => {
  const { getAccessToken, isAuth } = useAuth();
  const [rowData, setRowData] = useState<any[]>([]);
  const [daysToExpiry, setDaysToExpiry] = useState<number>(30);

  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching data");
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });

      try {
        const applications = await fetchApplications(client);
        const [appsWithSecrets, appsWithCertificates] = await Promise.all([
          fetchSecrets(client, applications),
          fetchCertificates(client, applications)
        ]);

        const flattenedData = flattenData(applications, appsWithSecrets, appsWithCertificates);
        console.log("Flattened Data:", flattenedData); // Log the flattened data
        setRowData(flattenedData);
      } catch (error) {
        console.error("Fetching data failed", error);
      }
    };

    if (isAuth) {
      fetchData();
    }
  }, [isAuth, getAccessToken]);

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

  return { rowData, daysToExpiry, setDaysToExpiry };
};

export default useFetchData;