import React from 'react';
import Layout from './layout';
import Corps from '../components/corps';
import Footer from '../components/footer';
import AgGridTable from '../components/DynamicAgGridTable';

const Home: React.FC = () => {
    return (
        <>
            <Corps />
            <Footer />
        </>
    );
};

export default Home;