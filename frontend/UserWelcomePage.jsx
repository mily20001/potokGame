import React, { Component } from 'react';
import {
    BrowserRouter,
    Route,
    Link,
} from 'react-router-dom';

import Strzalka from './Strzalka';
import StrzalkaSvg from './StrzalkaSvg';

export default class UserWelcomePage extends Component {
    render() {
        return (
            <div>
                Hello user!
                {/*<Strzalka X1={100} Y1={100} X2={200} Y2={200} />*/}
                {/*<Strzalka width={300} height={100} color="#0f0" />*/}
                {/*<Strzalka width={500} height={100} color="#0f0" />*/}
                {/*<Strzalka width={500} height={50} color="#0f0" />*/}
                <Strzalka width={30} startPoint={{x: 1000, y: 900}} endPoint={{x: 900, y: 300 }} color="#0f0" />
                {/*<StrzalkaSvg preserveAspectRatio="none" width={0} />*/}
                {/*<StrzalkaSvg preserveAspectRatio="none" width={5} />*/}
                {/*<StrzalkaSvg preserveAspectRatio="none" width={20} />*/}
            </div>
        );
    }
}
