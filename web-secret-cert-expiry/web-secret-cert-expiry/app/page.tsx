'use client';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  
  const handleRedirect = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex  justify-center min-h-screen">
      <h1>Bienvenue, veuillez vous authentifier pour accéder aux informations</h1>
      <button type="button" onClick={handleRedirect}>
        Go to Dashboard
      </button>
    </div>
  );
}