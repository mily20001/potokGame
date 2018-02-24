import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Popup from 'react-popup';

import './AdminTeams.scss';

export default class AdminTeamList extends Component {
    deleteTeam(teamId) {
        const team = this.props.databaseObjects.teams[teamId];
        Popup.create({
            title: 'Potwierdzenie',
            content: `Czy na pewno chcesz usunąć drużynę ${team.name}?`,
            buttons: {
                left: [{
                    text: 'Anuluj',
                    action: Popup.close,
                }],
                right: [{
                    text: 'Usuń',
                    className: 'danger',
                    action: () => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', `/delete_team?id=${teamId}`, true);
                        xhr.onload = () => {
                            try {
                                const result = JSON.parse(xhr.responseText);
                                if (result.ok !== undefined) {
                                    this.props.databaseObjects.refreshDatabase('teams');
                                    Popup.close();
                                } else {
                                    Popup.close();
                                    Popup.alert('Usuwanie drużyny nie powiodło się');
                                }
                            } catch (e) {
                                Popup.close();
                                Popup.alert('Usuwanie drużyny nie powiodło się');
                            }
                        };
                        xhr.send();
                    },
                }],
            },
        });
    }

    render() {
        const teams = Object.keys(this.props.databaseObjects.teams).map(key =>
            (<tr>
                <td>{this.props.databaseObjects.teams[key].name}</td>
                <td>{this.props.databaseObjects.teams[key].capitan_name}</td>
                <td >
                    <div
                        className="color-preview-table"
                        style={{ backgroundColor: this.props.databaseObjects.teams[key].color }}
                    />
                </td>
                <td
                    className="text-center"
                    onClick={() => this.props.editTeam(this.props.databaseObjects.teams[key])}
                >
                    <i className="fa fa-edit" />
                </td>
                <td
                    className="text-center"
                    onClick={() => this.deleteTeam(key)}
                >
                    <i className="fa fa-trash" />
                </td>
            </tr>));

        return (
            <div className="bg-dark text-light">
                <table className="table table-dark table-hover">
                    <thead>
                        <tr>
                            <th>Nazwa drużyny</th>
                            <th>Kapitan</th>
                            <th>Kolor</th>
                            <th>Edytuj</th>
                            <th>Usuń</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams}
                    </tbody>
                </table>
            </div>

        );
    }
}

AdminTeamList.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
    editTeam: PropTypes.func.isRequired,
};
