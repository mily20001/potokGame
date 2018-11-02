import React from 'react';

const W1 = 5.2793;
const W2 = 5.0194;
const W3 = 186.78;
const W4 = 8.4620726;

const StrzalkaSvg = props => (
    <svg height={`${props.height}px`} viewBox={`0 0 ${W4 + props.width} 3.8283202`}>
        <g transform="rotate(180 96.258 35.308)">
            <path d={`m${W3 - props.width} 66.865c0.14128-0.08741 0.30242-0.11748 0.4199 0 0.1135 0.11351 0.1135 0.30242 0 0.41566l-1.9055 1.1334 1.994-0.0083v0.59214l-1.994 0.0083 1.9055 1.1128c0.1135 0.11748 0.1135 0.30665 0 0.41989-0.11748 0.11748-0.27862 0.08741-0.4199 0l-2.6331-1.6291c-0.13651-0.08446-0.1135-0.30242 0-0.41566z`} fill={props.color} strokeWidth=".26458" />
        </g>
        <path d={`m${W1 + props.width} 1.6182-${W2 + props.width} 6.23e-5c-0.15138 0.028114-0.25994 0.11919-0.25994 0.29607 0 0.17274 0.10773 0.26406 0.25994 0.29607l${W2 + props.width}-7.02e-5z`} fill={props.color} />
    </svg>
);

export default StrzalkaSvg;

