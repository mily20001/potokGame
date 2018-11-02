import React from 'react';
import PropTypes from 'prop-types';

import StrzalkaSvg from './StrzalkaSvg';

export default function Strzalka(props) {
    const { startPoint, endPoint, width, color } = props;

    function angle(cx, cy, ex, ey) {
        const dy = ey - cy;
        const dx = ex - cx;
        let theta = Math.atan2(dy, dx); // range (-PI, PI]
        theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
        return theta;
    }

    function angle360(cx, cy, ex, ey) {
        let theta = angle(cx, cy, ex, ey); // range (-180, 180]
        if (theta < 0) theta = 360 + theta; // range [0, 360)
        return theta;
    }

    const arrowHeight = width;

    const xDiffSq = Math.pow(startPoint.x - endPoint.x, 2);
    const yDiffSq = Math.pow(startPoint.y - endPoint.y, 2);
    const arrowWidth = Math.sqrt(xDiffSq + yDiffSq);
    const arrowAngle = angle360(startPoint.x, startPoint.y, endPoint.x, endPoint.y);

    const ZERO_WIDTH_TO_HEIGHT_RATIO = 2.2103;
    const ONE_UNIT_WIDTH_TO_HEIGHT = 0.26109999999999983;

    const baseWidth = ZERO_WIDTH_TO_HEIGHT_RATIO * arrowHeight;
    const neededWidth = arrowWidth - baseWidth;
    if (neededWidth < 0) {
        console.warn('arrow too short');
        return (<div />);
    }

    const neededUnits = neededWidth / (ONE_UNIT_WIDTH_TO_HEIGHT * arrowHeight);

    const style = {
        position: 'absolute',
        top: `${startPoint.y}px`,
        left: `${startPoint.x}px`,
        transformOrigin: '0% 50%',
        transform: `rotate(${arrowAngle}deg)`,
        zIndex: '99',
    };

    return (
        <div style={style}>
            <StrzalkaSvg
                preserveAspectRatio="none"
                height={arrowHeight}
                width={neededUnits}
                color={color}
            />
        </div>
    );
}

Strzalka.propTypes = {
    width: PropTypes.number.isRequired,
    startPoint: PropTypes.object.isRequired,
    endPoint: PropTypes.object.isRequired,
    color: PropTypes.string,
};

Strzalka.defaultProps = {
    color: '#f0f',
};
