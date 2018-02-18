import React, { Component } from 'react';
import {
    BrowserRouter,
    Route,
    Link,
} from 'react-router-dom';

export default class AdminWelcomePage extends Component {
    // componentDidMount() {
    //     document.title = 'Panel Administratora';
    // }
    render() {
        return (
            <div>
                Hello admin!
            </div>
        );
    }
}
