import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'react-tippy';

import 'react-tippy/dist/tippy.css';
import './AdminDragons.scss';

export default class DragonCard extends Component {
    constructor() {
        super();
        this.state = {
            status: 'loading',
        };

        this.setReady = this.setReady.bind(this);
    }

    setReady() {
        this.setState({ status: 'ready' });
    }

    render() {
        const { status } = this.state;
        const { innerImageId } = this.props;

        // loading or no image
        const loading = status === 'loading' || innerImageId === -1;

        const borderWidth = 12;

        const frameStyle = {
            width: `${this.props.width}px`,
            // minWidth: '50px',
            height: `${this.props.height}px`,
            borderColor: this.props.teamColor,
            borderStyle: 'solid',
            borderWidth: `${borderWidth}px`,
            borderRadius: '5px',
            position: 'absolute',
            left: `${this.props.xPosition}px`,
            top: `${this.props.yPosition}px`,
            transformOrigin: 'left top',
            backgroundColor: 'black',
            userSelect: 'none',
            zIndex: 6,
            overflow: 'hidden',
        };

        const imageStyle = {
            width: '100%',
            height: '100%',
            ...(loading && { display: 'none ' }),
        };

        const loaderStyle = {
            width: '100%',
            height: '30px',
            marginTop: '60px',
            ...(!loading && { display: 'none ' }),
        };

        const frameContentStyle = {
            display: 'flex',
        };

        const tooltip =
            (<div>
                <div>{this.props.playerName}</div>
                <div>{this.props.dragonName}</div>
                <div>{`Poziom ${this.props.dragonLevel}`}</div>
                <div>{`${this.props.HP} HP`}</div>
            </div>);

        return (
            <div style={frameStyle}>
                <Tooltip
                    html={tooltip}
                    position="right"
                    trigger="mouseenter"
                    animation="shift"
                    distance={15}
                    theme="transparent"
                    arrow
                >
                    <div className="frame-content" style={frameContentStyle}>
                        <img
                            style={imageStyle}
                            src={`/get_image?id=${innerImageId}`}
                            alt="smok"
                            onLoad={this.setReady}
                        />

                        <div style={loaderStyle} className="image-loader-anim">
                            <div className="rect1" />
                            <div className="rect2" />
                            <div className="rect3" />
                            <div className="rect4" />
                            <div className="rect5" />
                        </div>
                    </div>
                </Tooltip>
            </div>
        );
    }
}

DragonCard.propTypes = {
    dragonId: PropTypes.number.isRequired,
    dragonName: PropTypes.string.isRequired,
    innerImageId: PropTypes.number.isRequired,
    HP: PropTypes.number.isRequired,
    playerName: PropTypes.string.isRequired,
    dragonLevel: PropTypes.number.isRequired,
    teamColor: PropTypes.string.isRequired,
    isInFortress: PropTypes.bool.isRequired,
    xPosition: PropTypes.number.isRequired,
    yPosition: PropTypes.number.isRequired,
    scale: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
};

DragonCard.defaultProps = {
    innerImage: '',
};
