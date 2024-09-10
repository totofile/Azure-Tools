import './globals.css';
import Head from 'next/head';



interface LayoutProps {
children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }: Readonly<{ children: React.ReactNode; }>) => {
return (
<html lang="en">
<Head>
<title>Application Secret/Certificates Dashboard</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
</Head>
<body className="flex flex-col min-h-screen">
{children}
</body>
</html>
);
};

export default Layout;