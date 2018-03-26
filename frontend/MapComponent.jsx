import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NotificationManager } from 'react-notifications';

import './Map.scss';
import MapFieldComponent from './MapFieldComponent';
import fieldImages from './fieldImages';

export default class MapComponent extends Component {
    constructor(props) {
        super();
        this.state = {
            mapX: 0,
            mapY: 0,
            mapScale: 1,
            mapImagePath: '',
            noMapFile: false,
            fieldPositionDeltas: {},
        };

        this.windowHeight = 600;
        this.windowWidth = 800;

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
        this.moveField = this.moveField.bind(this);
    }

    dragContinue(e) {
        const dx = this.initMapDragX - e.clientX;
        const dy = this.initMapDragY - e.clientY;
        this.initMapDragX = e.clientX;
        this.initMapDragY = e.clientY;
        this.setState({ mapX: this.state.mapX - dx, mapY: this.state.mapY - dy });
    }

    dragStart(e) {
        if (e.buttons !== 1 || e.ctrlKey) {
            return;
        }

        e.preventDefault();

        this.initMapDragX = e.clientX;
        this.initMapDragY = e.clientY;
        document.onmousemove = this.dragContinue;
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };
    }

    moveField(fieldId, dx, dy) {
        const deltas = { ...this.state.fieldPositionDeltas };
        if (deltas[fieldId] === undefined) {
            deltas[fieldId] = {
                x: 0,
                y: 0,
            };
        }

        deltas[fieldId].x += dx * (1 / this.state.mapScale);
        deltas[fieldId].y += dy * (1 / this.state.mapScale);

        this.setState({ fieldPositionDeltas: { ...deltas } });
    }

    handleZoom(e) {
        e.preventDefault();

        console.log(this.state.mapX, this.state.mapY);

        const centerX = -this.state.mapX + (this.windowWidth / 2);
        const centerY = -this.state.mapY + (this.windowHeight / 2);

        if (e.deltaY > 0) {
            this.setState({
                mapScale: this.state.mapScale * 0.85,
                mapX: this.state.mapX + (centerX * 0.15),
                mapY: this.state.mapY + (centerY * 0.15),
            });
        } else if (e.deltaY < 0) {
            this.setState({
                mapScale: this.state.mapScale * 1.15,
                mapX: this.state.mapX - (centerX * 0.15),
                mapY: this.state.mapY - (centerY * 0.15),
            });
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

        const mapStyle = {
            transform: `scale(${this.state.mapScale}) translate(${this.state.mapX / this.state.mapScale}px, ${this.state.mapY / this.state.mapScale}px)`,
            display: this.state.imageReady ? undefined : 'none',
        };

        return (
            <div className="map-main-container">
                <div
                    className="map-image-container"
                    onMouseDown={this.dragStart}
                    onWheel={this.handleZoom}
                >
                    {!this.state.imageReady &&
                        <div className="map-image-loader">
                            <span>{'Ładowanie mapy...'}</span>
                            <div className="spinner" />
                        </div>
                    }
                    <img
                        draggable
                        className="map-image"
                        style={mapStyle}
                        src={this.state.mapImagePath}
                        alt="mapa"
                        onLoad={() => this.setState({ imageReady: true })}
                    />

                    {this.state.imageReady &&
                        <div>
                            <MapFieldComponent
                                teamId={2}
                                teamColor="red"
                                regionName="niceRegion"
                                distance={3}
                                scale={this.state.mapScale}
                                fieldId={11}
                                isFortress={false}
                                positionX={400 * this.state.mapScale}
                                positionY={500 * this.state.mapScale}
                                translationX={this.state.mapX + ((this.state.fieldPositionDeltas[11] && this.state.fieldPositionDeltas[11].x) || 0) * this.state.mapScale}
                                translationY={this.state.mapY + ((this.state.fieldPositionDeltas[11] && this.state.fieldPositionDeltas[11].y) || 0) * this.state.mapScale}
                                innerImage={fieldImages.defaultImage}
                                isMovable
                                move={(x, y) => {
                                    this.moveField(11, x, y);
                                }}
                            />
                            <MapFieldComponent
                                teamId={2}
                                teamColor="green"
                                regionName="niceRegion"
                                distance={5}
                                scale={this.state.mapScale}
                                fieldId={12}
                                isFortress={false}
                                positionX={600 * this.state.mapScale}
                                positionY={1000 * this.state.mapScale}
                                translationX={this.state.mapX + ((this.state.fieldPositionDeltas[12] && this.state.fieldPositionDeltas[12].x) || 0) * this.state.mapScale}
                                translationY={this.state.mapY + ((this.state.fieldPositionDeltas[12] && this.state.fieldPositionDeltas[12].y) || 0) * this.state.mapScale}
                                innerImage={fieldImages.defaultImage}
                                isMovable
                                move={(x, y) => {
                                    this.moveField(12, x, y);
                                }}
                            />
                        </div>
                    }
                </div>
            </div>
        );
    }
}

MapComponent.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
