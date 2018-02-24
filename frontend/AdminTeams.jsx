import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AdminAddTeam from './AdminAddTeam';
import AdminTeamList from './AdminTeamList';

export default class AdminTeams extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editedTeam: {},
        };
    }

    render() {
        return (
            <div className="container bg-dark text-light" style={{ minWidth: '95%' }}>
                <div className="row">
                    <div className="col-md-12 col-lg-5 col-xl-6">
                        <AdminAddTeam
                            currentTeam={this.state.editedTeam}
                            finishEdit={() => { this.setState({ editedTeam: {} }); }}
                            databaseObjects={this.props.databaseObjects}
                        />
                    </div>
                    <div className="col-md-12 order-md-first order-lg-last col-lg-7 col-xl-6">
                        <AdminTeamList
                            editTeam={(team) => { this.setState({ editedTeam: team }); }}
                            databaseObjects={this.props.databaseObjects}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

AdminTeams.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
