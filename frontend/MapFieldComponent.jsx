import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Textfit } from 'react-textfit';
import Color from 'color';
import Style from 'style-it';

import 'react-tippy/dist/tippy.css';

import DragonCard from './DragonCard';
import Strzalka from './Strzalka';

export default class MapFieldComponent extends Component {
    constructor() {
        super();
        this.state = {
            imageHeight: 0,
            imageWidth: 0,
        };

        this.setImageSize = this.setImageSize.bind(this);
        this.dragStart = this.dragStart.bind(this);
        this.dragContinue = this.dragContinue.bind(this);
    }

    setImageSize(e) {
        this.setState({ imageHeight: e.target.height, imageWidth: e.target.width });
    }

    dragContinue(e) {
        const dx = this.initDragX - e.clientX;
        const dy = this.initDragY - e.clientY;
        this.initDragX = e.clientX;
        this.initDragY = e.clientY;
        this.props.move(-dx, -dy);
    }

    dragStart(e) {
        if (e.buttons !== 1) {
            return;
        }

        if (!e.ctrlKey) {
            return;
        }

        this.initDragX = e.clientX;
        this.initDragY = e.clientY;
        document.onmousemove = this.dragContinue;
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };
    }

    render() {
        const borderWidth = 20;
        const fortressWidth = 358;
        const fortressHeight = 166 + 80;
        const baseWidth = 180;
        const baseHeight = 270 + 37;

        const growDelta = 10;

        const frameWidth = this.props.isFortress ? fortressWidth : baseWidth;
        const frameHeight = this.props.isFortress ? fortressHeight : baseHeight;

        const frameBorderColor = Color(this.props.teamColor);

        const colorFrameHoveredBorderColor = frameBorderColor.isLight() ?
            frameBorderColor.darken(0.3) : frameBorderColor.lighten(0.35);

        const frameHoveredBorderColor = this.props.disabled ? Color('#aaa') : colorFrameHoveredBorderColor;

        const frameStyle = {
            width: `${frameWidth}px`,
            height: `${frameHeight}px`,
            borderColor: this.props.disabled ? '#aaa' : this.props.teamColor,
            borderStyle: 'solid',
            borderWidth: `${borderWidth}px`,
            borderRadius: '5px',
            position: 'absolute',
            left: `${this.props.positionX}px`,
            top: `${this.props.positionY}px`,
            transform: `scale(${this.props.scale}) translate(${this.props.translationX / this.props.scale}px, ${this.props.translationY / this.props.scale}px)`,
            transformOrigin: 'left top',
            backgroundColor: 'black',
            userSelect: 'none',
            zIndex: 5,
            transition: 'border 0.25s, width 0.25s, height 0.25s',
            cursor: (this.props.reachableMarked && !this.props.disabled) ? 'pointer' : 'initial',
        };

        const imageStyle = {
            width: '100%',
            height: 'auto',
        };

        const fontSizeBase = this.props.isFortress ?
            (frameHeight - 37 - (2 * borderWidth) - 20) / 2 :
            frameHeight - 37 - this.state.imageHeight - (2 * borderWidth);

        const detailsStyle = {
            flexGrow: 1,
            fontSize: `${fontSizeBase - 5}px`,
            lineHeight: `${fontSizeBase}px`,
            display: 'flex',
        };

        const signStyle = {
            flexGrow: 3,
            textAlign: 'center',
        };

        const distanceStyle = {
            flexGrow: 4,
            fontSize: `${fontSizeBase}px`,
            textAlign: this.props.isFortress ? 'center' : 'left',
        };

        const fieldOverlayStyle = {
            backgroundColor: 'blue',
            opacity: 0,
            width: `${frameWidth}px`,
            height: `${frameHeight}px`,
            zIndex: 1,
            position: 'absolute',
            left: `-${borderWidth}px`,
            top: `-${borderWidth}px`,
        };

        const fieldCardsContinerStyle = {
            zIndex: 6,
            position: 'absolute',
            left: `-${borderWidth}px`,
            top: `-${borderWidth}px`,
            overflow: 'visible',
        };

        const frameContentStyle = {
            display: 'flex',
            flexDirection: 'column',
        };

        const cardsWidth = baseWidth - (2 * borderWidth);
        const cardsHeight = baseHeight - 37 - (2 * borderWidth) - 45;

        const cardsOriginX = ((((1 - (this.props.cards.length % 2)) + 1) * (cardsWidth / -2)) +
                (frameWidth / 2))
            - (cardsWidth * Math.floor((this.props.cards.length - 1) / 2));

        const cardsOriginY = borderWidth + 30;

        const arrows = [];

        const cards = this.props.cards.map((card, index) => {
            const xPosition = cardsOriginX + (cardsWidth * index);
            const yPosition = cardsOriginY;

            if (this.props.reachableMarked && card.nextField && card.nextField.x) {
                const startPoint = {
                    x: ((xPosition + (cardsWidth / 2))
                        * this.props.scale) + (this.props.positionX + this.props.translationX),
                    y: ((yPosition + (cardsHeight / 2))
                        * this.props.scale) + (this.props.positionY
                        + (this.props.translationY - (borderWidth * this.props.scale))),
                };

                const endPoint = {
                    x: card.nextField.x,
                    y: card.nextField.y,
                };

                arrows.push(<Strzalka
                    width={70 * this.props.scale}
                    startPoint={startPoint}
                    endPoint={endPoint}
                    color="#ff0"
                    key={`next_field_arrow_from_${this.props.fieldId}_to_${card.nextField.id}`}
                />);
            }
            return (
                <DragonCard
                    key={`dragon_card_${card.playerName}`}
                    {...card}
                    scale={this.props.scale}
                    yPosition={yPosition}
                    xPosition={xPosition}
                    width={cardsWidth}
                    height={cardsHeight}
                    isInFortress={this.props.isFortress}
                />
            );
        });

        const onClickEvent = () => {
            if (this.props.reachableMarked && !this.props.disabled) {
                this.props.selectNextField();
            }
        };

        if (this.props.isFortress) {
            return Style.it(`
                    #field_${this.props.fieldId}_main:hover {
                        border-color: ${frameHoveredBorderColor.hex()} !important;
                        /* border-width: ${borderWidth + growDelta}px !important;
                        width: ${frameWidth + (growDelta * 2)}px !important;
                        height: ${frameHeight + (growDelta * 2)}px !important; */
                    }
                `,
                <div>
                    {arrows}
                    <div id={`field_${this.props.fieldId}_main`} style={frameStyle} onClick={onClickEvent}>
                        <div style={fieldCardsContinerStyle}>
                            {cards}
                        </div>
                        {this.props.isMovable &&
                            <div style={fieldOverlayStyle} onMouseDown={this.dragStart} />
                        }

                        <div className="frame-content" style={frameContentStyle}>
                            <div className="fortress-details">
                                <Textfit mode="single" max={25}>
                                    {this.props.regionName}
                                    <i style={{ marginLeft: '10px' }} className="fa fa-map-signs" />
                                    {this.props.distance}
                                </Textfit>
                            </div>
                            <div>
                                <img
                                    style={imageStyle}
                                    onLoad={this.setImageSize}
                                    src={this.props.innerImage}
                                    alt="tło pola"
                                />
                            </div>
                        </div>
                    </div>
                </div>);
        }

        return Style.it(`
                #field_${this.props.fieldId}_main:hover {
                    border-color: ${frameHoveredBorderColor.hex()} !important;
                    /* border-width: ${borderWidth + growDelta}px !important;
                    width: ${frameWidth + (growDelta * 2)}px !important;
                    height: ${frameHeight + (growDelta * 2)}px !important; */
                }
            `,
            <div>
                {arrows}
                <div id={`field_${this.props.fieldId}_main`} style={frameStyle} onClick={onClickEvent}>
                    <div style={fieldCardsContinerStyle}>
                        {cards}
                    </div>
                    {this.props.isMovable &&
                        <div style={fieldOverlayStyle} onMouseDown={this.dragStart} />
                    }

                    <div className="frame-content" style={frameContentStyle}>
                        <div className="region-name">
                            <Textfit mode="single" max={25}>
                                {this.props.regionName}
                            </Textfit>
                        </div>
                        <div>
                            <img
                                style={imageStyle}
                                onLoad={this.setImageSize}
                                src={this.props.innerImage}
                                alt="tło pola"
                            />
                        </div>
                        <div style={detailsStyle}>
                            <i style={signStyle} className="fa fa-map-signs" />
                            <div style={distanceStyle}>{this.props.distance}</div>
                        </div>
                    </div>
                </div>
            </div>);
    }
}

MapFieldComponent.propTypes = {
    teamId: PropTypes.number.isRequired,
    teamColor: PropTypes.string.isRequired,
    regionName: PropTypes.string.isRequired,
    distance: PropTypes.number.isRequired,
    scale: PropTypes.number.isRequired,
    fieldId: PropTypes.number.isRequired,
    isFortress: PropTypes.bool.isRequired,
    positionX: PropTypes.number.isRequired,
    positionY: PropTypes.number.isRequired,
    translationX: PropTypes.number.isRequired,
    translationY: PropTypes.number.isRequired,
    innerImage: PropTypes.string.isRequired,
    isMovable: PropTypes.bool.isRequired,
    move: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    cards: PropTypes.array,
    reachableMarked: PropTypes.bool,
    selectNextField: PropTypes.func,
};

MapFieldComponent.defaultProps = {
    disabled: false,
    selectNextField: () => {},
    cards: [],
    reachableMarked: false,
};
