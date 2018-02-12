import React, { Component } from 'react';
import {
    BrowserRouter,
    Route,
    Link,
} from 'react-router-dom';

import Login from './Login';
import AdminWelcomePage from './AdminWelcomePage';
import AdminSideBar from './AdminSideBar';

export default class Admin extends Component {
    render() {
        return (
            <div className="row bg-dark text-white fullpage-container">
                <div className="container col-sm-4 col-md-3 col-xl-2 sidebar ">
                    <AdminSideBar />
                </div>
                <div className="container col-sm-8 col-md-9 col-xl-10">
                    <Route path="/admin" component={AdminWelcomePage} />
                    <Route path="/admin/lol" component={Login} />
                </div>
            </div>
        );
    }
}
