import React, { Component } from 'react';
import {
    BrowserRouter,
    Route,
    Link,
} from 'react-router-dom';

import App from './App';
import Admin from './Admin';
import Login from './Login';

export default class Main extends Component {
    render() {
        return (
            <BrowserRouter>
                <div className="container fullpage-container">
                    <Route exact path="/" component={App} />
                    <Route path="/admin" component={Admin} />
                    <Route path="/login" component={Login} />
                </div>
            </BrowserRouter>
        );
    }
}
