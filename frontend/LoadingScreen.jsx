import React from 'react';

import './LoadingScreen.scss';

export default function LoadinScreen() {
    return (
        <div className="loader-container text-light">
            <p>Ładowanie...</p>
            <div className="spinner" />
        </div>
    );
}
