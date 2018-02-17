import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AdminAddUser from './AdminAddUser';
import AdminUserList from './AdminUserList';

export default class AdminUsers extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editedUser: {},
        };
    }

    render() {
        return (
            <div className="container bg-dark text-light" style={{ minWidth: '95%' }}>
                <div className="row">
                    <div className="col-md-12 col-lg-5 col-xl-6">
                        <AdminAddUser
                            currentUser={this.state.editedUser}
                            finishEdit={() => { this.setState({ editedUser: {} }); }}
                            databaseObjects={this.props.databaseObjects}
                        />
                    </div>
                    <div className="col-md-12 order-md-first order-lg-last col-lg-7 col-xl-6">
                        <AdminUserList
                            editUser={(user) => { this.setState({ editedUser: user }); }}
                            databaseObjects={this.props.databaseObjects}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

AdminUsers.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
