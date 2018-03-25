import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NotificationManager } from 'react-notifications';

import './Map.scss';

export default class MapComponent extends Component {
    constructor(props) {
        super();
        this.state = {
            mapX: 0,
            mapY: 0,
            mapScale: 1,
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

        this.dragStart = this.dragStart.bind(this);
        this.dragContinue = this.dragContinue.bind(this);
        this.handleZoom = this.handleZoom.bind(this);
    }

    dragContinue(e) {
        const dx = this.initMapDragX - e.clientX;
        const dy = this.initMapDragY - e.clientY;
        this.initMapDragX = e.clientX;
        this.initMapDragY = e.clientY;
        this.setState({mapX: this.state.mapX - dx, mapY: this.state.mapY - dy});
    }

    dragStart(e) {
        e.preventDefault();
        if (e.buttons !== 1 || e.ctrlKey) {
            return;
        }
        this.initMapDragX = e.clientX;
        this.initMapDragY = e.clientY;
        document.onmousemove = this.dragContinue;
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };
    }

    handleZoom(e) {
        e.preventDefault();
        if(e.deltaY > 0) {
            this.setState({mapScale: this.state.mapScale * 0.9});
        } else if (e.deltaY < 0) {
            this.setState({mapScale: this.state.mapScale * 1.1});
        }
        // this.setState(e.deltaY)
    }

    render() {
        if (this.state.noMapFile) {
            return (
                <div>
                    Brak pliku mapy :C
                </div>
            );
        }

        const mapStyle = {
            transform: `scale(${this.state.mapScale}) translate(${this.state.mapX / this.state.mapScale}px, ${this.state.mapY / this.state.mapScale}px)`,
            display: this.state.imageReady ? undefined : 'none',
        };

        return (
            <div className="map-main-container">
                <div className="map-image-container">
                    <img
                        onWheel={this.handleZoom}
                        draggable
                        className="map-image"
                        style={mapStyle}
                        src={this.state.mapImagePath}
                        alt="mapa"
                        onLoad={() => this.setState({ imageReady: true })}
                        onMouseDown={this.dragStart}
                    />
                </div>
                {!this.state.imageReady &&
                    <div>
                        {'Ładowanie mapy...'}
                    </div>
                }
            </div>
        );
    }
}

MapComponent.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
