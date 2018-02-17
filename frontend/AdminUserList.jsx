import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Popup from 'react-popup';

export default class AdminUserList extends Component {
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
        const users = Object.keys(this.props.databaseObjects.users).map(key =>
            (<tr>
                <td>{this.props.databaseObjects.users[key].username}</td>
                <td>{this.props.databaseObjects.users[key].name}</td>
                <td>{this.props.databaseObjects.users[key].surname}</td>
                <td
                    className="text-center"
                    onClick={() => this.props.editUser(this.props.databaseObjects.users[key])}
                >
                    <i className="fa fa-edit" />
                </td>
                <td
                    className="text-center"
                    onClick={() => this.deleteUser(key)}
                >
                    <i className="fa fa-trash" />
                </td>
            </tr>));

        return (
            <div className="bg-dark text-light">
                <table className="table table-dark table-hover">
                    <thead>
                        <tr>
                            <th>Nazwa użytkownika</th>
                            <th>Imię</th>
                            <th>Nazwisko</th>
                            <th>Edytuj</th>
                            <th>Usuń</th>
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

AdminUserList.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
    editUser: PropTypes.func.isRequired,
};
