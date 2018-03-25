import React, { Component } from 'react';
import PropTypes from 'prop-types';

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
        console.log('Image height:', e.target.height);
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
        if (e.buttons !== 1 || !e.ctrlKey) {
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
        const fortressWidth = 340;
        const fortressHeight = 180;
        const baseWidth = 180;
        const baseHeight = 270;

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
            display: 'flex',
            flexDirection: this.props.isFortress ? 'row' : 'column',
            userSelect: 'none',
            zIndex: 10,
        };

        console.log(frameStyle.transform);

        const imageStyle = {
            width: '100%',
            height: 'auto',
        };

        const detailsStyle = {
            flexGrow: 1,
            fontSize: `${frameHeight - this.state.imageHeight - (2 * borderWidth) - 5}px`,
            lineHeight: `${frameHeight - this.state.imageHeight - (2 * borderWidth)}px`,
            display: 'flex',
        };

        const signStyle = {
            flexGrow: 3,
            textAlign: 'center',
        };

        const distanceStyle = {
            flexGrow: 4,
            fontSize: `${frameHeight - this.state.imageHeight - (2 * borderWidth)}px`,
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

        // console.log(frameHeight, this.state.imageHeight);

        return (
            <div style={frameStyle}>
                {this.props.isMovable &&
                    <div style={fieldOverlayStyle} onMouseDown={this.dragStart} />
                }
                <div>
                    <img
                        style={imageStyle}
                        onLoad={this.setImageSize}
                        src={this.props.innerImage}
                    />
                </div>
                <div style={detailsStyle}>
                    <i style={signStyle} className="fa fa-map-signs" />
                    <div style={distanceStyle}>{this.props.distance}</div>
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
};
