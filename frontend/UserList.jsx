import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Popup from 'react-popup';
import { NotificationManager } from 'react-notifications';

import './User.scss';

export default class UserList extends Component {
    constructor() {
        super();
        this.state = {
            editedRow: undefined,
            editedColumns: {},
        };

        this.editUser = this.editUser.bind(this);
        this.handleField = this.handleField.bind(this);
        this.cancelEdit = this.cancelEdit.bind(this);
        this.saveEdit = this.saveEdit.bind(this);
    }

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

    editUser(id) {
        if (this.props.editUser && typeof this.props.editUser === 'function') {
            this.props.editUser(this.props.databaseObjects.users[id]);
        } else {
            const user = this.props.databaseObjects.users[id];

            const filteredUser = Object.keys(user).reduce((tmpUser, key) => {
                if (user[key] === null || user[key] === undefined) {
                    return { ...tmpUser, [key]: undefined };
                    // return tmpUser;
                }
                return { ...tmpUser, [key]: user[key] };
            }, {});

            this.setState({ ...filteredUser, editedColumns: {}, editedRow: id });
        }
    }

    cancelEdit(id) {
        if (this.state.editedRow === id) {
            this.setState({ editedRow: undefined, editedColumns: {} });
        }
    }

    handleField(fieldId, newVal) {
        const editedColumns = { ...this.state.editedColumns };
        editedColumns[fieldId] = 1;
        this.setState({ [fieldId]: newVal, editedColumns });
    }

    saveEdit(id) {
        if (this.state.editedRow !== id) {
            return;
        }

        const data = new FormData();

        Object.keys(this.state.editedColumns).forEach((key) => {
            data.append(key, this.state[key]);
        });

        data.append('id', this.state.id);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/add_user', true);
        xhr.onload = () => {
            try {
                const uploadResponse = JSON.parse(xhr.responseText);
                if (uploadResponse.ok !== undefined) {
                    NotificationManager.success('Zmiany zapisane');
                    this.props.databaseObjects.refreshDatabase('users');
                    this.cancelEdit(id);
                } else {
                    NotificationManager.error('Nie udało się edytować użytkownika', 'Błąd', 5000);
                }
            } catch (e) {
                NotificationManager.error('Nie udało się edytować użytkownika', 'Błąd', 5000);
            }
        };
        xhr.send(data);
    }

    prepareForm(tableFields) {
        // const obligatoryFields = ['username', 'name', 'surname', 'role'];

        const fields = {
            username: { placeholder: 'Nazwa użytkownika', type: 'text' },
            name: { placeholder: 'Imię', type: 'text' },
            surname: { placeholder: 'Nazwisko', type: 'text' },
            role: { type: 'dropdown', options: [['player', 'Gracz'], ['admin', 'Administrator']] },
            dragon: {
                id: 'dragon_id',
                type: 'dropdown',
                placeholder: 'Wybierz smoka',
                options: Object.keys(this.props.databaseObjects.dragons).map(key =>
                [key, this.props.databaseObjects.dragons[key].name]),
            },
            team: {
                id: 'team_id',
                type: 'dropdown',
                placeholder: 'Wybierz drużynę',
                options: Object.keys(this.props.databaseObjects.teams).map(key =>
                [key, this.props.databaseObjects.teams[key].name]),
            },
            starting_points: { type: 'number' },
            current_field_name: {
                id: 'current_field',
                type: 'dropdown',
                placeholder: 'Wybierz pole',
                options: Object.keys(this.props.databaseObjects.fields).map(key =>
                [key, this.props.databaseObjects.fields[key].name]),
            },
            next_field_name: {
                id: 'next_field',
                type: 'dropdown',
                placeholder: 'Wybierz pole',
                options: Object.keys(this.props.databaseObjects.fields).map(key =>
                [key, this.props.databaseObjects.fields[key].name]),
            },
            hp: { type: 'number' },
        };

        this.fieldsArr = Object.keys(fields).map(key => fields[key].id || key);

        return tableFields.map((fieldName) => {
            const fieldId = (fields[fieldName] && fields[fieldName].id) || fieldName;
            const field = fields[fieldName];
            // console.log(fieldName, fieldId, field);

            if (field === undefined) {
                return (
                    <td>{this.state[fieldId] === null ? '-' : this.state[fieldId]}</td>
                );
            }
            if (field.type === 'dropdown') {
                const options = field.options.map(option => (
                    <option
                        value={option[0]}
                    >
                        {option[1]}
                    </option>
                ));

                if (field.placeholder !== undefined) {
                    options.push(<option value="" disabled selected>{field.placeholder}</option>);
                }

                return (
                    <td>
                        <select
                            className="form-control bg-dark text-white"
                            id={fieldId}
                            onChange={e => this.handleField(fieldId, e.target.value)}
                            value={this.state[fieldId]}
                        >
                            {options}
                        </select>
                    </td>
                );
            }
            return (
                <td>
                    <input
                        type={field.type}
                        className="form-control bg-dark text-white"
                        id={fieldName}
                        name={fieldName}
                        onChange={e => this.handleField(fieldId, e.target.value)}
                        value={this.state[fieldId]}
                        placeholder={field.placeholder}
                    />
                </td>
            );
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
                fields.push('starting_points');
                headerFields.push('Bonusowe XP');
            }
            fields.push('current_field_name');
            headerFields.push('Aktualne pole');

            if (this.props.isAdmin) {
                fields.push('next_field_name');
                headerFields.push('Następne pole');
            }
        }

        if (this.props.isEditable) {
            headerFields.push('Edytuj', 'Reset hasła', 'Usuń');
        }

        const header = headerFields.map(field => <th>{field}</th>);

        const users = Object.keys(this.props.databaseObjects.users).map((key) => {
            const user = this.props.databaseObjects.users[key];

            let columns;

            const isEdited = this.state.editedRow === key;

            if (isEdited) {
                columns = this.prepareForm(fields);
            } else {
                columns = fields.map((field) => {
                    if (user[field] !== null) {
                        return (<td>{user[field]}</td>);
                    }
                    return (<td>-</td>);
                });
            }

            if (this.props.isEditable && !isEdited) {
                columns.push(
                    <td
                        className="text-center"
                        onClick={() => this.editUser(key)}
                    >
                        <i className="fa fa-edit" />
                    </td>);

                columns.push(
                    <td
                        className="text-center"
                        onClick={() => this.resetPassword(key)}
                    >
                        <i className="fa fa-key" />
                    </td>);

                columns.push(
                    <td
                        className="text-center"
                        onClick={() => this.deleteUser(key)}
                    >
                        <i className="fa fa-trash" />
                    </td>);
            }

            if (isEdited) {
                columns.push(
                    <td
                        className="text-center"
                        onClick={() => this.saveEdit(key)}
                    >
                        <i className="fa fa-check" />
                    </td>);

                columns.push(
                    <td style={{ textAlign: 'center' }}>
                        <i className="fa fa-minus" />
                    </td>);

                columns.push(
                    <td
                        className="text-center"
                        onClick={() => this.cancelEdit(key)}
                    >
                        <i className="fa fa-times" />
                    </td>);
            }

            return (<tr>{columns}</tr>);
        });

        return (
            <div className="bg-dark text-light user-list-container">
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
    editUser: undefined,
    isEditable: false,
    compact: false,
    isAdmin: false,
};
