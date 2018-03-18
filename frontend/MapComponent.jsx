import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NotificationManager } from 'react-notifications';

export default class MapComponent extends Component {
    constructor(props) {
        super();
        this.state = {
            mapX: 0,
            mapY: 0,
            mapImagePath: '',
            noMapFile: false,
        };

        const mapId = Object.keys(props.databaseObjects.images).reduce((result, id) => {
            if (props.databaseObjects.images[id].type === 'map') { return id; }
            return result;
        }, -1);

        if (mapId === -1) {
            NotificationManager.error('Wgraj plik mapy', 'Brak pliku mapy');
            this.state.noMapFile = true;
        } else {
            this.state.mapImagePath = `/get_image?id=${mapId}`;
        }
    }

    render() {
        if (this.state.noMapFile) {
            return (
                <div>
                    Brak pliku mapy :C
                </div>
            );
        }

        return (
            <div className="map-main-container">
                <img className="map-image" src={this.state.mapImagePath} alt="mapa" />
            </div>
        );
    }
}

MapComponent.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
