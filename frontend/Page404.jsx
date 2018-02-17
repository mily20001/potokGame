import React from 'react';
import { Link } from 'react-router-dom';

export default function Page404() {
    return (
        <div style={{ color: 'white', fontSize: '36px' }}>
            <p>Popsuło się (404) :C</p>
            <Link to="/">Spróbuj jeszcze raz</Link>
        </div>
    );
}
