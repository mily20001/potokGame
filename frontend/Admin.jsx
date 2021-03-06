import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Route,
    Switch,
} from 'react-router-dom';

import AdminWelcomePage from './AdminWelcomePage';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import FileUploader from './FileUploader';
import AdminMapManager from './AdminMapManager';
import AdminUsers from './AdminUsers';
import AdminPoints from './AdminPoints';
import AdminTeams from './AdminTeams';
import AdminRegions from './AdminRegions';
import AdminDragons from './AdminDragons';
import Page404 from './Page404';
import UserList from './UserList';
import UserSettings from './UserSettings';
import prettyFormat from 'pretty-format';

export default class Admin extends Component {
    constructor() {
        super();
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
        document.title = 'Panel Administratora';
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
            paddingLeft: this.state.sidebarHidden ? 0 : `${this.sidebarWidth}px`,
        };

        return (
            <div className="bg-dark text-white fullpage-container">
                <AdminNavbar
                    toggleSidebar={this.toggleSidebar}
                    width={this.state.width}
                    username={this.props.user.name}
                    logout={this.props.databaseObjects.logout}
                />
                <div className="admin-sidebar-container">
                    <AdminSidebar
                        status={this.state.sidebarHidden}
                        sidebarWidth={this.sidebarWidth}
                    />
                </div>
                <div style={mainStyle} className="admin-main-container">
                    <Switch>
                        <Route
                            exact
                            path="/admin"
                            render={() =>
                            (<AdminWelcomePage
                                databaseObjects={this.props.databaseObjects}
                            />)
                        }
                        />
                        <Route
                            path="/admin/map/upload"
                            render={() => (<FileUploader
                                customFileName
                                refreshImageList={() =>
                                    this.props.databaseObjects.refreshDatabase('images')}
                            />)}
                        />
                        <Route
                            exact
                            path="/admin/map"
                            render={() =>
                                <AdminMapManager databaseObjects={this.props.databaseObjects} />
                            }
                        />
                        <Route
                            path="/admin/add_user"
                            render={() =>
                                <AdminUsers databaseObjects={this.props.databaseObjects} />
                            }
                        />
                        <Route
                            exact
                            path="/admin/points"
                            render={() =>
                                (<AdminPoints
                                    databaseObjects={this.props.databaseObjects}
                                    isEditable
                                />)
                            }
                        />
                        <Route
                            path="/admin/teams"
                            render={() =>
                                <AdminTeams databaseObjects={this.props.databaseObjects} />
                            }
                        />
                        <Route
                            path="/admin/regions"
                            render={() =>
                                <AdminRegions databaseObjects={this.props.databaseObjects} />
                            }
                        />
                        <Route
                            path="/admin/dragons"
                            render={() =>
                                (<AdminDragons
                                    databaseObjects={this.props.databaseObjects}
                                    isEditable
                                />)
                            }
                        />
                        <Route
                            path="/admin/users"
                            render={() =>
                                (<UserList
                                    databaseObjects={this.props.databaseObjects}
                                    isAdmin
                                    isEditable
                                />)
                            }
                        />
                        <Route
                            path="/admin/settings"
                            render={() =>
                                (<div className="container">
                                    <UserSettings
                                        databaseObjects={this.props.databaseObjects}
                                        currentUser={this.props.user}
                                        isAdmin
                                    />
                                </div>)
                            }
                        />
                        <Route
                            path="/admin/history"
                            render={() => {
                                let history = '';
                                try {
                                    history = JSON.parse(this.props.databaseObjects.config.lastLog).join('\n');
                                } catch (e) {
                                    history = prettyFormat(e);
                                }

                                return (<div className="container">
                                    <div className="hist-box">
                                        <pre>{history}</pre>
                                    </div>
                                </div>);
                            }}
                        />
                        <Route component={Page404} />
                    </Switch>
                </div>
            </div>
        );
    }
}

Admin.propTypes = {
    user: PropTypes.object.isRequired,
    databaseObjects: PropTypes.object.isRequired,
};
