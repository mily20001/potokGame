import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Popup from 'react-popup';
import { NotificationManager } from 'react-notifications';

import './AdminDragons.scss';

export default class AdminDragonDetails extends Component {
    constructor() {
        super();
        this.state = {
            changes: {},
            editedColId: undefined,
            newFieldAdded: false,
        };

        this.cancelEdit = this.cancelEdit.bind(this);
        this.prepareNewField = this.prepareNewField.bind(this);
    }

    prepareNewField() {
        const lastLevelPos = Object.keys(this.props.dragon.levels).length - 1;
        const lastLevelKey = Object.keys(this.props.dragon.levels)[lastLevelPos];
        const lastLevel = this.props.dragon.levels[lastLevelKey];

        let level = { ...lastLevel };
        level.level ++;

        if (lastLevelPos < 0) {
            level = {
                xp: 0,
                level: 1,
                strength: 1,
                defence: 1,
                range: 1,
                hp: 1,
            };
        }

        this.setState({ changes: { ...level }, newFieldAdded: true, editedColId: undefined });
    }

    cancelEdit() {
        this.setState({ changes: {}, editedColId: undefined, newFieldAdded: false });
    }

    saveChanges() {
        if (this.state.editedColId && this.state.newFieldAdded === undefined) {
            return;
        }

        const data = new FormData();

        Object.keys(this.state.changes).forEach((key) => {
            data.append(key, this.state.changes[key]);
        });

        const isEdited = this.state.editedColId !== undefined;

        if (isEdited) {
            data.append('id', this.state.editedColId);
        }

        data.append('dragonId', this.props.dragon.id);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/add_level', true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            try {
                const uploadResponse = JSON.parse(xhr.responseText);
                if (uploadResponse.ok !== undefined) {
                    if (isEdited) {
                        NotificationManager.success('', 'Pomyślnie zmieniono poziom');
                    } else {
                        NotificationManager.success('', 'Pomyślnie dodano nowy poziom');
                    }
                    this.props.refreshDatabase('dragons');
                    this.cancelEdit();
                } else if (isEdited) {
                    NotificationManager.error('Nie udało się edytować poziomu', 'Błąd');
                } else {
                    NotificationManager.error('Nie udało się dodać nowego poziomu', 'Błąd');
                }
            } catch (e) {
                if (isEdited) {
                    NotificationManager.error('Nie udało się edytować poziomu', 'Błąd');
                } else {
                    NotificationManager.error('Nie udało się dodać nowego poziomu', 'Błąd');
                }
            }
        };
        xhr.send(data);
    }

    deleteCol(colId) {
        const level = this.props.dragon.levels[colId];
        Popup.create({
            title: 'Potwierdzenie',
            content: `Czy na pewno chcesz usunąć poziom ${level.level}?`,
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
                        xhr.open('GET', `/delete_level?id=${colId}`, true);
                        xhr.onload = () => {
                            try {
                                const result = JSON.parse(xhr.responseText);
                                if (result.ok !== undefined) {
                                    NotificationManager.success('', 'Pomyślnie usunięto poziom');
                                    this.props.refreshDatabase('dragons');
                                    Popup.close();
                                } else {
                                    Popup.close();
                                    Popup.alert('Usuwanie poziomu nie powiodło się');
                                }
                            } catch (e) {
                                Popup.close();
                                Popup.alert('Usuwanie poziomu nie powiodło się');
                            }
                        };
                        xhr.send();
                    },
                }],
            },
        });
    }

    render() {
        const levelTableRow = {
            xp: [<th>XP</th>],
            level: [<th>Poziom</th>],
            strength: [<th>Siła</th>],
            defence: [<th>Obrona</th>],
            range: [<th>Zasięg</th>],
            hp: [<th>Życie</th>],
        };

        if (this.props.isEditable) {
            levelTableRow.edit = [<th>Edytuj</th>];
            levelTableRow.remove = [<th>Usuń</th>];
        }

        const dragon = this.props.dragon;

        Object.keys(dragon.levels).forEach((levelId) => {
            if (!this.state.newFieldAdded && this.state.editedColId === levelId) {
                Object.keys(this.state.changes).forEach((key) => {
                    levelTableRow[key].push(
                        <td>
                            <input
                                type="number"
                                value={this.state.changes[key]}
                                onChange={e => this.setState({ changes:
                                        { ...this.state.changes, [key]: e.target.value },
                                })}
                            />
                        </td>);
                });

                levelTableRow.edit.push(
                    <td>
                        <i
                            className="fa fa-check"
                            onClick={() => { this.saveChanges(); }}
                        />
                    </td>);

                levelTableRow.remove.push(
                    <td>
                        <i
                            className="fa fa-times"
                            onClick={this.cancelEdit}
                        />
                    </td>);
            } else if (!this.state.newFieldAdded) {
                const level = { ...dragon.levels[levelId] };

                Object.keys(level).forEach((key) => {
                    levelTableRow[key].push(<td>{level[key]}</td>);
                });
                if (this.props.isEditable) {
                    levelTableRow.edit.push(
                        <td>
                            <i
                                className="fa fa-edit"
                                onClick={() => this.setState({
                                    changes: level,
                                    editedColId: levelId,
                                })}
                            />
                        </td>);
                    levelTableRow.remove.push(
                        <td>
                            <i className="fa fa-trash" onClick={() => this.deleteCol(levelId)} />
                        </td>);
                }
            } else {
                const level = { ...dragon.levels[levelId] };

                Object.keys(level).forEach((key) => {
                    levelTableRow[key].push(<td>{level[key]}</td>);
                });
                levelTableRow.edit.push(
                    <td>
                        <i className="fa fa-edit" />
                    </td>);
                levelTableRow.remove.push(
                    <td>
                        <i className="fa fa-trash" />
                    </td>);
            }
        });

        // add new column
        if (this.state.newFieldAdded) {
            Object.keys(this.state.changes).forEach((key) => {
                levelTableRow[key].push(
                    <td>
                        <input
                            type="number"
                            value={this.state.changes[key]}
                            onChange={e => this.setState({ changes:
                                    { ...this.state.changes, [key]: e.target.value },
                            })}
                        />
                    </td>);
            });
            levelTableRow.edit.push(
                <td>
                    <i
                        className="fa fa-check"
                        onClick={() => { this.saveChanges(); }}
                    />
                </td>);
            levelTableRow.remove.push(
                <td>
                    <i
                        className="fa fa-times"
                        onClick={this.cancelEdit}
                    />
                </td>);
        }

        return (
            <div className="dragon-details">
                <table className="table table-dark table-hover dragon-table">
                    <tbody>
                        {Object.keys(levelTableRow).map(rowId => <tr>{levelTableRow[rowId]}</tr>)}
                    </tbody>
                </table>
                {this.props.isEditable &&
                    <div className="dragon-details-new-level" onClick={this.prepareNewField}>
                        <i className="fa fa-plus" />
                    </div>
                }
            </div>
        );
    }
}

AdminDragonDetails.propTypes = {
    dragon: PropTypes.object.isRequired,
    refreshDatabase: PropTypes.func,
    isEditable: PropTypes.bool,
};

AdminDragonDetails.defaultProps = {
    refreshDatabase: () => {},
    isEditable: false,
};
