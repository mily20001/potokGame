import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Popup from 'react-popup';

export default class UserList extends Component {
    deleteUser(userId) {
        const user = this.props.databaseObjects.users[userId];
        Popup.create({
            title: 'Potwierdzenie',
            content: `Czy na pewno chcesz usunąć użytkownika ${user.username} (${user.name} ${user.surname})?`,
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
                        xhr.open('GET', `/delete_user?id=${userId}`, true);
                        xhr.onload = () => {
                            try {
                                const result = JSON.parse(xhr.responseText);
                                if (result.ok !== undefined) {
                                    this.props.databaseObjects.refreshDatabase('users');
                                    Popup.close();
                                } else {
                                    Popup.close();
                                    Popup.alert('Usuwanie użytkownika nie powiodło się');
                                }
                            } catch (e) {
                                Popup.close();
                                Popup.alert('Usuwanie użytkownika nie powiodło się');
                            }
                        };
                        xhr.send();
                    },
                }],
            },
        });
    }

    render() {
        const headerFields = [];
        const fields = [];

        if (this.props.isAdmin) {
            fields.push('username');
            headerFields.push('Nazwa użytkownika');
        }

        fields.push('name', 'surname');
        headerFields.push('Imię', 'Nazwisko');

        if (this.props.isAdmin) {
            fields.push('role');
            headerFields.push('Rola');
        }

        if (!this.props.compact) {
            fields.push('team', 'dragon', 'hp', 'xp');
            headerFields.push('Drużyna', 'Smok', 'HP', 'XP');
            if (this.props.isAdmin) {
                fields.push('starting_xp');
                headerFields.push('Początkowe XP');
            }
        }

        if (this.props.isEditable) {
            headerFields.push('Edytuj', 'Usuń');
        }

        const header = headerFields.map(field => <th>{field}</th>);

        const users = Object.keys(this.props.databaseObjects.users).map((key) => {
            const user = this.props.databaseObjects.users[key];

            const columns = fields.map((field) => {
                if (user[field] !== null) { return (<td>{user[field]}</td>); }
                return (<td>-</td>);
            });

            if (this.props.isEditable) {
                columns.push(
                    <td
                        className="text-center"
                        onClick={() => this.props.editUser(user[key])}
                    >
                        <i className="fa fa-edit" />
                    </td>);

                columns.push(
                    <td
                        className="text-center"
                        onClick={() => this.deleteUser(key)}
                    >
                        <i className="fa fa-trash" />
                    </td>);
            }

            return (<tr>{columns}</tr>);
        });

        return (
            <div className="bg-dark text-light">
                <table className="table table-dark table-hover">
                    <thead>
                        <tr>
                            {header}
                        </tr>
                    </thead>
                    <tbody>
                        {users}
                    </tbody>
                </table>
            </div>

        );
    }
}

UserList.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
    editUser: PropTypes.func,
    isEditable: PropTypes.bool,
    compact: PropTypes.bool,
    isAdmin: PropTypes.bool,
};

UserList.defaultProps = {
    editUser: () => {},
    isEditable: false,
    compact: false,
    isAdmin: false,
};
