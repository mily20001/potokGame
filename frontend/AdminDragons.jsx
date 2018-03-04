import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NotificationManager } from 'react-notifications';
import Popup from 'react-popup';
import RandomString from 'randomstring';

import './AdminDragons.scss';

import AdminDragonDetails from './AdminDragonDetails';
import AdminDragonPreview from './AdminDragonPreview';

export default class AdminDragons extends Component {
    constructor() {
        super();
        this.state = {
            newDragon: {},
            imagesOnUpdate: [],
            hoveredTitle: undefined,
            editedTitle: undefined,
            editedVal: '',
            newDragonBeingAdded: false,
        };

        this.changeDragonImage = this.changeDragonImage.bind(this);
        this.changeDragonName = this.changeDragonName.bind(this);
        this.deleteDragon = this.deleteDragon.bind(this);
    }

    changeDragonImage(dragonId, newImageId) {
        const reqString = `/change_dragon_image?dragonId=${dragonId}&imageId=${newImageId}`;

        this.setState({ imagesOnUpdate: [...this.state.imagesOnUpdate, dragonId] });

        const xhr = new XMLHttpRequest();
        xhr.open('GET', reqString, true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            try {
                const uploadResponse = JSON.parse(xhr.responseText);
                if (uploadResponse.ok !== undefined) {
                    NotificationManager.success('', 'Pomyślnie zmieniono obrazek');
                    this.props.databaseObjects.refreshDatabase('dragons');
                    const imagesOnUpdate
                        = this.state.imagesOnUpdate.filter(val => val !== dragonId);
                    this.setState({ imagesOnUpdate });
                } else {
                    NotificationManager.error('Nie udało się zmienić obrazka smoka', 'Błąd');
                    const imagesOnUpdate
                        = this.state.imagesOnUpdate.filter(val => val !== dragonId);
                    this.setState({ imagesOnUpdate });
                }
            } catch (reqErr) {
                NotificationManager.error('Nie udało się zmienić obrazka smoka', 'Błąd');
                const imagesOnUpdate = this.state.imagesOnUpdate.filter(val => val !== dragonId);
                this.setState({ imagesOnUpdate });
            }
        };
        xhr.send();
    }

    changeDragonName() {
        if (this.state.editedVal.length === 0) {
            NotificationManager.error('Nazwa smoka nie może być pusta', 'Błąd', 5000);
            return;
        }

        const isNameEdited = (this.state.editedTitle !== undefined);

        let reqString = '';

        if (isNameEdited) {
            reqString = `/change_dragon_name?dragonId=${this.state.editedTitle}` +
                `&newName=${encodeURIComponent(this.state.editedVal)}`;
        } else {
            reqString = `/add_dragon_by_name?newName=${encodeURIComponent(this.state.editedVal)}`;
        }

        const xhr = new XMLHttpRequest();
        xhr.open('GET', reqString, true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            try {
                const uploadResponse = JSON.parse(xhr.responseText);
                if (uploadResponse.ok !== undefined) {
                    if (isNameEdited) {
                        NotificationManager.success('', 'Pomyślnie zmieniono nazwę smoka');
                    } else {
                        NotificationManager.success('', 'Pomyślnie dodano smoka');
                    }
                    this.props.databaseObjects.refreshDatabase('dragons');
                    this.setState({ editedTitle: undefined, newDragonBeingAdded: false });
                } else if (isNameEdited) {
                    NotificationManager.error('Nie udało się zmienić nazwy smoka', 'Błąd');
                } else {
                    NotificationManager.error('Nie udało się dodać smoka', 'Błąd');
                }
            } catch (reqErr) {
                if (isNameEdited) {
                    NotificationManager.error('Nie udało się zmienić nazwy smoka', 'Błąd');
                } else {
                    NotificationManager.error('Nie udało się dodać smoka', 'Błąd');
                }
            }
        };
        xhr.send();
    }

    deleteDragon(dragonId) {
        const dragon = this.props.databaseObjects.dragons[dragonId];
        Popup.create({
            title: 'Potwierdzenie',
            content: `Czy na pewno chcesz usunąć smoka o nazwie ${dragon.name}?`,
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
                        xhr.open('GET', `/delete_dragon?id=${dragonId}`, true);
                        xhr.onload = () => {
                            try {
                                const result = JSON.parse(xhr.responseText);
                                if (result.ok !== undefined) {
                                    NotificationManager.success('', 'Pomyślnie usunięto smoka');
                                    this.props.databaseObjects.refreshDatabase('dragons');
                                    Popup.close();
                                } else {
                                    Popup.close();
                                    Popup.alert('Usuwanie smoka nie powiodło się');
                                }
                            } catch (e) {
                                Popup.close();
                                Popup.alert('Usuwanie smoka nie powiodło się');
                            }
                        };
                        xhr.send();
                    },
                }],
            },
        });
    }

    render() {
        const dragons = Object.keys(this.props.databaseObjects.dragons).map((id) => {
            const title = [];
            if (!this.props.isEditable) {
                title.push(
                    <h2 className="text-center">
                        {this.props.databaseObjects.dragons[id].name}
                    </h2>);
            } else if (this.state.editedTitle === id) {
                title.push(
                    <h2
                        className="text-center dragon-title"
                    >
                        <i
                            className="fa fa-check"
                            onClick={this.changeDragonName}
                        />
                        &nbsp;
                        <input
                            type="text"
                            onChange={e => this.setState({ editedVal: e.target.value })}
                            value={this.state.editedVal}
                        />
                        &nbsp;
                        <i
                            className="fa fa-times"
                            onClick={() => this.setState({ editedTitle: undefined })}
                        />
                    </h2>);
            } else if (this.state.hoveredTitle === id) {
                title.push(
                    <h2
                        className="text-center dragon-title"
                        onMouseLeave={() => {
                            if (this.state.hoveredTitle === id) {
                                this.setState({ hoveredTitle: undefined });
                            }
                        }}
                    >
                        <i className="fa fa-trash" onClick={() => this.deleteDragon(id)} />
                        &nbsp;{this.props.databaseObjects.dragons[id].name}&nbsp;
                        <i
                            className="fa fa-edit"
                            onClick={() => this.setState({
                                editedTitle: id,
                                editedVal: this.props.databaseObjects.dragons[id].name,
                            })}
                        />
                    </h2>);
            } else {
                title.push(
                    <h2
                        className="text-center"
                        onMouseEnter={() => this.setState({ hoveredTitle: id })}
                    >
                        {this.props.databaseObjects.dragons[id].name}
                    </h2>);
            }
            return (
                <div>
                    {title}
                    <div className="row dragon-preview-and-details">
                        <AdminDragonPreview
                            dragonId={id}
                            databaseObjects={this.props.databaseObjects}
                            changeImage={newImageId => this.changeDragonImage(id, newImageId)}
                            isBeingUpdated={this.state.imagesOnUpdate.includes(id)}
                            isEditable={this.props.isEditable}
                        />
                        <AdminDragonDetails
                            dragon={this.props.databaseObjects.dragons[id]}
                            refreshDatabase={this.props.databaseObjects.refreshDatabase}
                            isEditable={this.props.isEditable}
                        />
                    </div>
                </div>
            );
        });

        if (this.state.newDragonBeingAdded) {
            dragons.push(
                <div>
                    <h2
                        className="text-center dragon-title"
                    >
                        <i
                            className="fa fa-check"
                            onClick={this.changeDragonName}
                        />
                        &nbsp;
                        <input
                            type="text"
                            onChange={e => this.setState({ editedVal: e.target.value })}
                            value={this.state.editedVal}
                            placeholder="Wpisz nazwę smoka"
                        />
                        &nbsp;
                        <i
                            className="fa fa-times"
                            onClick={() => this.setState({ newDragonBeingAdded: false })}
                        />
                    </h2>
                    <div className="row dragon-preview-and-details">
                        <AdminDragonPreview
                            dragonId={Math.round(Math.random() * 10000000)}
                            databaseObjects={this.props.databaseObjects}
                        />
                        <AdminDragonDetails
                            dragon={{ levels: {} }}
                            refreshDatabase={this.props.databaseObjects.refreshDatabase}
                        />
                    </div>
                </div>);
        }

        return (
            <div className="container bg-dark text-light" style={{ minWidth: '90%' }}>
                {dragons}
                {(this.props.isEditable && !this.state.newDragonBeingAdded) &&
                    <div className="add-new-dragon">
                        <i
                            className="fa fa-plus-circle"
                            onClick={() => this.setState({
                                newDragonBeingAdded: true,
                                editedVal: '',
                            })}
                        />
                    </div>
                }
            </div>
        );
    }
}

AdminDragons.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
    isEditable: PropTypes.bool,
};

AdminDragons.defaultProps = {
    isEditable: false,
};
