import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './AdminDragons.scss';

import AdminDragonDetails from './AdminDragonDetails';
import AdminDragonPreview from './AdminDragonPreview';

export default class AdminDragons extends Component {
    constructor() {
        super();
        this.state = {
            newDragon: {},
            imagesOnUpdate: [],
        };

        this.changeDragonImage = this.changeDragonImage.bind(this);
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
                    this.props.databaseObjects.refreshDatabase('dragons');
                    const imagesOnUpdate
                        = this.state.imagesOnUpdate.filter(val => val !== dragonId);
                    this.setState({ imagesOnUpdate });
                } else {
                    // TODO print some error
                    /**/
                    const imagesOnUpdate
                        = this.state.imagesOnUpdate.filter(val => val !== dragonId);
                    this.setState({ imagesOnUpdate });
                }
            } catch (reqErr) {
                /**/
                const imagesOnUpdate = this.state.imagesOnUpdate.filter(val => val !== dragonId);
                this.setState({ imagesOnUpdate });
            }
        };
        xhr.send();
    }

    render() {
        const dragons = Object.keys(this.props.databaseObjects.dragons).map(id => (
            <div>
                <h2 className="text-center">{this.props.databaseObjects.dragons[id].name}</h2>
                <div className="row dragon-preview-and-details">
                    <AdminDragonPreview
                        dragonId={id}
                        databaseObjects={this.props.databaseObjects}
                        changeImage={newImageId => this.changeDragonImage(id, newImageId)}
                        isBeingUpdated={this.state.imagesOnUpdate.includes(id)}
                    />
                    <AdminDragonDetails
                        dragon={this.props.databaseObjects.dragons[id]}
                        refreshDatabase={this.props.databaseObjects.refreshDatabase}
                    />
                </div>
            </div>
        ));

        return (
            <div className="container bg-dark text-light" style={{ minWidth: '90%' }}>
                {dragons}
            </div>
        );
    }
}

AdminDragons.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
