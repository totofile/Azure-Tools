import React from 'react';

const Header = () => {
    return (
        <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <h1 className="text-xl">My App Header</h1>
            <button className="bg-white text-blue-600 p-2 rounded">Login</button>
        </header>
    );
};

export default Header;