import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NotificationManager } from 'react-notifications';
import Fullscreen from 'react-full-screen';
import Measure from 'react-measure';

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
            isFullScreen: false,
            fieldScale: parseFloat(props.databaseObjects.config.fieldsScale),
            dragonImages: {},
            isBeingEdited: false,
            reachableMarked: false,
            selectedNextField: -1,
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
        this.moveField = this.moveField.bind(this);
        this.saveChanges = this.saveChanges.bind(this);
        this.reverseChanges = this.reverseChanges.bind(this);
        this.startFinishEditing = this.startFinishEditing.bind(this);
        this.selectNextField = this.selectNextField.bind(this);
    }

    componentWillMount() {
        this.userToDragonImage = {};
        Object.keys(this.props.databaseObjects.fields).forEach((id) => {
            const field = this.props.databaseObjects.fields[id];
            field.users.forEach((userId) => {
                const user = this.props.databaseObjects.users[userId];
                this.userToDragonImage[userId] = -1;
                if (user.dragon_id !== null
                    && this.props.databaseObjects.dragons[user.dragon_id].image !== null
                ) {
                    const imageId = this.props.databaseObjects.dragons[user.dragon_id].image;
                    this.userToDragonImage[userId] = imageId;
                }
            });
        });
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.databaseObjects.config.fieldsScale !==
            nextProps.databaseObjects.config.fieldsScale
        ) {
            this.setState({ fieldScale: parseFloat(nextProps.databaseObjects.config.fieldsScale) });
        }
    }

    startFinishEditing(newState) {
        this.reverseChanges();
        this.setState({ isBeingEdited: newState });
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

        deltas[fieldId].x += dx / this.state.mapScale;
        deltas[fieldId].y += dy / this.state.mapScale;

        this.setState({ fieldPositionDeltas: { ...deltas } });
    }

    handleZoom(e) {
        e.preventDefault();

        console.log(this.state.mapX, this.state.mapY);

        const centerX = -this.state.mapX + (this.state.dimensions.width / 2);
        const centerY = -this.state.mapY + (this.state.dimensions.height / 2);

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

    reverseChanges() {
        this.setState({
            fieldScale: parseFloat(this.props.databaseObjects.config.fieldsScale),
            fieldPositionDeltas: {},
        });
    }

    saveChanges() {
        const fieldsMoved = Object.keys(this.state.fieldPositionDeltas).length !== 0;
        const scaleChanged = parseFloat(this.state.fieldScale) !==
            parseFloat(this.props.databaseObjects.config.fieldsScale);

        if (!fieldsMoved && !scaleChanged) {
            NotificationManager.info('Brak zmian do zapisania');
            return;
        }

        const data = new FormData();

        if (fieldsMoved) {
            Object.keys(this.state.fieldPositionDeltas).forEach((fieldId) => {
                data.append('ids', fieldId);
                data.append(`${fieldId}_x`, this.state.fieldPositionDeltas[fieldId].x
                    + this.props.databaseObjects.fields[fieldId].map_x);
                data.append(`${fieldId}_y`, this.state.fieldPositionDeltas[fieldId].y
                    + this.props.databaseObjects.fields[fieldId].map_y);
            });
        } else {
            data.append('fieldsScale', this.state.fieldScale);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', fieldsMoved ? '/move_fields' : '/update_config', true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            try {
                const uploadResponse = JSON.parse(xhr.responseText);
                if (uploadResponse.ok !== undefined) {
                    if (fieldsMoved) {
                        this.props.databaseObjects.refreshDatabase('fields');
                        this.setState({ fieldPositionDeltas: {} });
                        if (scaleChanged) {
                            this.saveChanges();
                        }
                    } else {
                        this.props.databaseObjects.refreshDatabase('config');
                    }

                    NotificationManager.success('Zmiany zapisane pomyślnie');
                } else {
                    NotificationManager.error('Nie udało się zapisać zmian', 'Błąd');
                }
            } catch (e) {
                NotificationManager.error('Nie udało się zapisać zmian', 'Błąd');
            }
        };
        xhr.send(data);
    }

    selectNextField(fieldId) {
        if (this.state.reachableMarked) {
            this.setState({selectedNextField: fieldId});
        }
    }

    saveSelectedNextField() {
        if (this.state.selectedNextField === -1) {
            return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/set_next_field?id=${this.state.selectedNextField}`, true);
        xhr.onload = () => {
            try {
                const res = JSON.parse(xhr.responseText);
                if (res.ok !== undefined) {
                    this.setState({ reachableMarked: false, selectedNextField: -1 });
                    this.props.databaseObjects.refreshDatabase('currentUser');
                    this.props.databaseObjects.refreshDatabase('users');

                    NotificationManager.success('Zmiany zapisane pomyślnie');
                } else {
                    NotificationManager.error('Nie udało się zapisać zmian', 'Błąd');
                }
            } catch (e) {
                NotificationManager.error('Nie udało się zapisać zmian', 'Błąd');
            }
        };
        xhr.send();
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

        const fieldDistances = Object.keys(this.props.databaseObjects.fields).map(id =>
            this.props.databaseObjects.fields[id].distance);

        const maxDistance = Math.max(...fieldDistances);

        const fieldsScale =
            this.state.mapScale * parseFloat(this.state.fieldScale);

        const fields = Object.keys(this.props.databaseObjects.fields).map((id) => {
            const field = this.props.databaseObjects.fields[id];

            if (field.map_x === null || field.map_y === null) {
                field.map_x = 0;
                field.map_y = 0;
            }

            const dx = ((this.state.fieldPositionDeltas[id]
                && this.state.fieldPositionDeltas[id].x)
                || 0);

            const dy = ((this.state.fieldPositionDeltas[id]
                && this.state.fieldPositionDeltas[id].y)
                || 0);

            const translationX = this.state.mapX + (dx * this.state.mapScale);
            const translationY = this.state.mapY + (dy * this.state.mapScale);

            const isFortress = field.distance === maxDistance;

            const cards = this.state.isBeingEdited ? [] : field.users.map((userId) => {
                const user = this.props.databaseObjects.users[userId];
                const innerImageId =
                    (this.userToDragonImage && this.userToDragonImage[userId]) || -1;

                const nextField = {
                    id: user.next_field,
                };

                if (user.id === this.props.user.id
                    && this.state.reachableMarked
                    && this.state.selectedNextField !== -1
                ) {
                    nextField.id = this.state.selectedNextField;
                }

                if (nextField.id || nextField.id === 0) {
                    const nextFieldObj = this.props.databaseObjects.fields[nextField.id];
                    nextField.x = (nextFieldObj.map_x * this.state.mapScale) + translationX;
                    nextField.y = (nextFieldObj.map_y * this.state.mapScale) + translationY;
                }

                return ({
                    dragonId: user.dragon_id,
                    dragonName: user.dragon,
                    innerImageId,
                    HP: user.hp,
                    dragonLevel: (user.lvl && user.lvl.level) || -1,
                    teamColor: user.team_color,
                    playerName: `${user.name} ${user.surname}`,
                    nextField,
                });
            });

            return (
                <MapFieldComponent
                    key={`field_${id}`}
                    teamId={field.team_id}
                    teamColor={field.color}
                    regionName={field.name}
                    distance={field.distance}
                    scale={fieldsScale}
                    fieldId={parseInt(id, 10)}
                    positionX={field.map_x * this.state.mapScale}
                    positionY={field.map_y * this.state.mapScale}
                    translationX={translationX}
                    translationY={translationY}
                    innerImage={isFortress ? fieldImages.fortressImage : fieldImages.defaultImage}
                    isMovable={this.props.isEditable && this.state.isBeingEdited}
                    move={(x, y) => {
                        this.moveField(id, x, y);
                    }}
                    isFortress={isFortress}
                    cards={cards}
                    disabled={this.state.reachableMarked
                        && !this.props.user.reachableFields.includes(parseInt(id, 10))}
                    reachableMarked={this.state.reachableMarked}
                    selectNextField={() => this.selectNextField(parseInt(id, 10))}
                />
            );
        });

        const fieldsMoved = Object.keys(this.state.fieldPositionDeltas).length > 0
            || parseFloat(this.state.fieldScale)
                !== parseFloat(this.props.databaseObjects.config.fieldsScale);

        return (
            <div className="map-main-container">
                {this.props.isEditable && this.state.isBeingEdited &&
                    <div className="map-manager-buttons">
                        <button
                            onClick={this.saveChanges}
                            className="btn btn-outline-light btn-lg"
                            disabled={!fieldsMoved}
                        >
                            Zapisz zmiany
                        </button>
                        <button
                            onClick={this.reverseChanges}
                            className="btn btn-outline-light btn-lg"
                            disabled={!fieldsMoved}
                        >
                            Cofnij zmiany
                        </button>
                        <button
                            onClick={() => this.startFinishEditing(false)}
                            className="btn btn-outline-light btn-lg"
                        >
                            Zakończ edycję
                        </button>
                        <label htmlFor="fieldScaleInput" style={{ marginLeft: '20px', marginRight: '5px' }}>
                            Rozmiar pól
                        </label>
                        <input
                            type="number"
                            id="fieldScaleInput"
                            className="form-control bg-dark text-white"
                            name="fieldScale"
                            style={{ display: 'inline-block', width: '75px', height: '48px' }}
                            onChange={e => this.setState({ fieldScale: e.target.value })}
                            value={this.state.fieldScale}
                            step={0.05}
                        />
                    </div>
                }
                {this.props.isEditable && !this.state.isBeingEdited &&
                    <div className="map-manager-buttons">
                        <button
                            onClick={() => this.startFinishEditing(true)}
                            className="btn btn-outline-light btn-lg"
                        >
                            Edytuj ustawienie pól
                        </button>
                    </div>
                }
                {this.props.isNextFieldChoosable && !this.state.reachableMarked &&
                    <div className="map-manager-buttons">
                        <button
                            onClick={() =>
                                this.setState({ reachableMarked: true, selectedNextField: -1 })}
                            className="btn btn-outline-light btn-lg"
                        >
                            Wybierz następne pole
                        </button>
                    </div>
                }
                {this.props.isNextFieldChoosable && this.state.reachableMarked &&
                    <div className="map-manager-buttons">
                        <button
                            onClick={() => this.saveSelectedNextField()}
                            className="btn btn-outline-light btn-lg"
                            disabled={this.state.selectedNextField === -1}
                        >
                            Zapisz zmiany
                        </button>
                        <button
                            onClick={() => this.setState({ reachableMarked: false })}
                            className="btn btn-outline-light btn-lg"
                        >
                            Anuluj
                        </button>
                    </div>
                }
                <Measure
                    bounds
                    onResize={(contentRect) => {
                        this.setState({ dimensions: contentRect.bounds });
                    }}
                >
                    {({ measureRef }) =>
                        (<Fullscreen
                            enabled={this.state.isFullScreen}
                            onChange={isFullScreen => this.setState({ isFullScreen })}
                        >
                            <div
                                className="map-image-container"
                                onMouseDown={this.dragStart}
                                onWheel={this.handleZoom}
                                ref={measureRef}
                                style={{
                                    height: this.state.isFullScreen ? '100%' :
                                        `${window.innerHeight - (this.props.isEditable || this.props.isNextFieldChoosable ? 150 : 90)}px`,
                                }}
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

                                <div className="fullscreen-button">
                                    <button
                                        className="btn btn-outline-light btn-lg"
                                        onClick={() =>
                                            this.setState({
                                                isFullScreen: !this.state.isFullScreen,
                                            })}
                                    >
                                        <i
                                            className={`fa fa-${this.state.isFullScreen ?
                                                'compress' : 'expand-arrows-alt'}`}
                                        />
                                    </button>
                                </div>

                                {this.state.imageReady &&
                                <div>
                                    {fields}
                                </div>
                                }
                            </div>
                        </Fullscreen>)
                    }
                </Measure>
            </div>
        );
    }
}

MapComponent.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
    user: PropTypes.object,
    isEditable: PropTypes.bool,
    isNextFieldChoosable: PropTypes.bool,
};

MapComponent.defaultProps = {
    isEditable: false,
    isNextFieldChoosable: false,
    user: {},
};
