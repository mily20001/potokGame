import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Popup from 'react-popup';

import './AdminRegions.scss';
import AdminRegionsRow from './AdminRegionsRow';

export default class AdminRegions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editedRegion: undefined,
            newRegion: false,
        };

        this.sendChanges = this.sendChanges.bind(this);
    }

    deleteRegion(regionId) {
        const region = this.props.databaseObjects.regions[regionId];
        Popup.create({
            title: 'Potwierdzenie',
            content: `Czy na pewno chcesz usunąć region ${region.name}?`,
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
                        xhr.open('GET', `/delete_region?id=${regionId}`, true);
                        xhr.onload = () => {
                            try {
                                const result = JSON.parse(xhr.responseText);
                                if (result.ok !== undefined) {
                                    this.props.databaseObjects.refreshDatabase('regions');
                                    this.props.databaseObjects.refreshDatabase('fields');
                                    Popup.close();
                                } else {
                                    Popup.close();
                                    Popup.alert('Usuwanie regionu nie powiodło się');
                                }
                            } catch (e) {
                                Popup.close();
                                Popup.alert('Usuwanie regionu nie powiodło się');
                            }
                        };
                        xhr.send();
                    },
                }],
            },
        });
    }

    sendChanges() {
        if (this.state.editedRegion === undefined && this.state.newRegion === false) {
            return;
        }

        if (this.state.name === undefined || this.state.name === ''
            || this.state.distance === undefined || this.state.distance < 1
        ) {
            this.setState({ status: 1 });
            return;
        }

        const data = new FormData();
        data.append('name', this.state.name);
        data.append('distance', this.state.distance);

        if (this.state.editedRegion !== undefined) {
            data.append('id', this.state.editedRegion);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/add_region', true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            try {
                const uploadResponse = JSON.parse(xhr.responseText);
                if (uploadResponse.ok !== undefined) {
                    this.setState({ status: 0 });
                    this.props.databaseObjects.refreshDatabase('regions');
                    this.props.databaseObjects.refreshDatabase('fields');
                    this.setState({ editedRegion: undefined, newRegion: false });
                } else {
                    this.setState({ status: 3 });
                }
            } catch (e) {
                this.setState({ status: 3 });
            }
        };
        xhr.send(data);
        this.setState({ status: -1 });
    }

    render() {
        const regions = Object.keys(this.props.databaseObjects.regions)
            .map((key) => {
                const region = this.props.databaseObjects.regions[key];
                const isBeingEdited = this.state.editedRegion === key;
                return (
                    <AdminRegionsRow
                        regionName={isBeingEdited ? this.state.name : region.name}
                        regionDistance={isBeingEdited ? this.state.distance : region.distance}
                        isEditable
                        isBeingEdited={isBeingEdited}
                        onEdit={() => this.setState({
                            editedRegion: key,
                            name: region.name,
                            distance: region.distance,
                            newRegion: false,
                            status: -1,
                        })}
                        onCancel={() => this.setState({
                            editedRegion: undefined,
                            newRegion: false,
                        })}
                        onValueChange={(name, value) => this.setState({ [name]: value })}
                        onSave={this.sendChanges}
                        onDelete={() => this.deleteRegion(key)}
                    />);
            });

        return (
            <div className="container bg-dark text-light text-center">
                <h1>Regiony</h1>
                {this.state.status === 0 &&
                    <div className="alert alert-success">Zmiany zapisane</div>
                }
                {this.state.status === 1 &&
                    <div className="alert alert-danger">Uzupełnij brakujące pola</div>
                }
                {this.state.status === 3 &&
                    <div className="alert alert-danger">Zmiany nie zostały zapisane</div>
                }
                <div className="bg-dark text-light">
                    <table className="table table-dark table-hover">
                        <thead>
                            <tr>
                                <th>Nazwa regionu</th>
                                <th>Dystans</th>
                                <th>Edytuj</th>
                                <th>Usuń</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regions}
                            {!this.state.newRegion &&
                                <tr>
                                    <td
                                        colSpan={4}
                                        onClick={() => this.setState({
                                            newRegion: true,
                                            editedRegion: undefined,
                                            status: -1,
                                        })}
                                        className="regions-table-add-button"
                                    >
                                        <i className="fa fa-plus" />
                                    </td>
                                </tr>
                            }
                            {this.state.newRegion &&
                                <AdminRegionsRow
                                    regionName={this.state.name}
                                    regionDistance={this.state.distance}
                                    isEditable
                                    isBeingEdited
                                    onCancel={() => this.setState({
                                        editedRegion: undefined,
                                        newRegion: false,
                                    })}
                                    onValueChange={(name, value) =>
                                        this.setState({ [name]: value })}
                                    onSave={this.sendChanges}
                                />
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

AdminRegions.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
