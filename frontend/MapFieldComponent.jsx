import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'react-tippy';
import { Textfit } from 'react-textfit';

import 'react-tippy/dist/tippy.css';

import DragonCard from './DragonCard';

export default class MapFieldComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            imageHeight: 0,
            imageWidth: 0,
        };

        this.setImageSize = this.setImageSize.bind(this);
        this.dragStart = this.dragStart.bind(this);
        this.dragContinue = this.dragContinue.bind(this);
    }

    setImageSize(e) {
        // console.log('Image height:', e.target.height);
        this.setState({ imageHeight: e.target.height, imageWidth: e.target.width });
    }

    dragContinue(e) {
        // console.log('DRAGGING FIELD');
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

        const frameWidth = this.props.isFortress ? fortressWidth : baseWidth;
        const frameHeight = this.props.isFortress ? fortressHeight : baseHeight;

        const frameStyle = {
            width: `${frameWidth}px`,
            height: `${frameHeight}px`,
            borderColor: this.props.teamColor,
            borderStyle: 'solid',
            borderWidth: `${borderWidth}px`,
            borderRadius: '5px',
            position: 'absolute',
            left: `${this.props.positionX}px`,
            top: `${this.props.positionY}px`,
            transform: `scale(${this.props.scale}) translate(${this.props.translationX / this.props.scale}px, ${this.props.translationY / this.props.scale}px)`,
            transformOrigin: 'left top',
            backgroundColor: 'black',
            // display: 'flex',
            // flexDirection: this.props.isFortress ? 'row' : 'column',
            userSelect: 'none',
            zIndex: 5,
        };

        // console.log(frameStyle.transform);

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
            // flexDirection: this.props.isFortress ? 'column' : 'row',
        };

        const signStyle = {
            flexGrow: 3,
            textAlign: 'center',
            // paddingTop: this.props.isFortress ? '10px' : 0,
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
            // flexDirection: this.props.isFortress ? 'row' : 'column',
            flexDirection: 'column',
        };

        const cardsWidth = baseWidth - (2 * borderWidth);
        const cardsHeight = baseHeight - 37 - (2 * borderWidth) - 45;

        const cardsOriginX = ((((1 - (this.props.cards.length % 2)) + 1) * (cardsWidth / -2)) +
                (frameWidth / 2))
            - (cardsWidth * Math.floor((this.props.cards.length - 1) / 2));

        const cardsOriginY = borderWidth + 30;

        const cards = this.props.cards.map((card, index) => (
            <DragonCard
                {...card}
                scale={this.props.scale}
                yPosition={cardsOriginY}
                xPosition={cardsOriginX + (cardsWidth * index)}
                width={cardsWidth}
                height={cardsHeight}
                isInFortress={this.props.isFortress}
            />
            ));

        if (this.props.isFortress) {
            return (
                <div style={frameStyle}>
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
            );
        }

        return (
            <div style={frameStyle}>
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
        );
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
    cards: PropTypes.array,
};

MapFieldComponent.defaultProps = {
    cards: [],
};
