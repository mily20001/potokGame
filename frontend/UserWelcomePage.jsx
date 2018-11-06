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
            </div>
        );
    }
}
