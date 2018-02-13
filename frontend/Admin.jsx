import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Route,
} from 'react-router-dom';

import Login from './Login';
import AdminWelcomePage from './AdminWelcomePage';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import FileUploader from "./FileUploader";

export default class Admin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sidebarHidden: false,
            sidebarManualToggled: false,
            width: 0,
        };

        this.sidebarTreshold = 800;
        this.sidebarWidth = 250;

        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
        this.toggleSidebar = this.toggleSidebar.bind(this);

        // console.log(this.props.history.location.pathname);
        // if(this.props.history.location.pathname === '/admin') {
        //     this.props.history.push('/admin/start');
        // }
    }

    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
    }

    updateWindowDimensions() {
        this.setState({ width: window.innerWidth });

        console.log(this.state.width, window.innerWidth);

        if (!this.state.sidebarManualToggled) {
            if (window.innerWidth < this.sidebarTreshold) {
                this.setState({ sidebarHidden: true });
            } else {
                this.setState({ sidebarHidden: false });
            }
        }
    }

    toggleSidebar() {
        console.log('Sidebar toggled');
        this.setState({ sidebarHidden: !this.state.sidebarHidden, sidebarManualToggled: true });
    }

    render() {
        const mainStyle = {
            marginLeft: this.state.sidebarHidden ? 0 : `${this.sidebarWidth}px`,
        };

        return (
            <div className="bg-dark text-white fullpage-container">
                <AdminNavbar
                    toggleSidebar={this.toggleSidebar}
                    width={this.state.width}
                    username={this.props.user.name}
                />
                <div className="admin-sidebar-container">
                    <AdminSidebar
                        status={this.state.sidebarHidden}
                        sidebarWidth={this.sidebarWidth}
                    />
                </div>
                <div style={mainStyle} className="admin-main-container">
                    <Route exact path="/admin" component={AdminWelcomePage} />
                    <Route
                        path="/admin/map/upload"
                        render={() => <FileUploader messageText={'Wyślij plik mapy'} imageType={'map'} />}
                    />
                </div>
            </div>
        );
    }
}

Admin.propTypes = {
    user: PropTypes.object.isRequired,
};
