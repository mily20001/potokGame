import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AdminPointsMainTable from './AdminPointsMainTable';
import './AdminPoints.scss';

export default class AdminPoints extends Component {
    constructor(props) {
        super(props);

        this.state = {
            dates: [],
            userPoints: {},
            changes: {},
            savedChanges: {},
            ongoingChanges: {},
        };

        this.idToUserAndDate = {};

        Object.keys(this.props.databaseObjects.users).forEach((userId) => {
            console.log(this.props.databaseObjects.users[userId].role);
            if (this.props.databaseObjects.users[userId].role === 'admin') {
                return;
            }

            this.state.userPoints[userId] = {};
            Object.keys(this.props.databaseObjects.users[userId].points).forEach((date) => {
                const tmpDate = (new Date(date)).valueOf();

                if (!this.state.dates.includes(tmpDate)) {
                    this.state.dates.push(tmpDate);
                }

                const id = this.props.databaseObjects.users[userId].points[date].id;

                this.idToUserAndDate[id] = { userId, date: tmpDate };

                this.state.userPoints[userId][tmpDate] =
                    { ...this.props.databaseObjects.users[userId].points[date] };
            });
        });

        this.state.dates = this.state.dates.sort((a, b) => (new Date(a)) - (new Date(b)));

        this.handleField = this.handleField.bind(this);
        this.commitChanges = this.commitChanges.bind(this);
        this.updateNewDate = this.updateNewDate.bind(this);
        this.handlePointsToggle = this.handlePointsToggle.bind(this);

        this.commitIntervalId = setInterval(this.commitChanges, 10000);
    }

    componentWillUnmount() {
        clearInterval(this.commitIntervalId);
    }

    handleField(fieldName, event) {
        console.log(fieldName, event.target.value);
        this.setState({ [fieldName]: event.target.value });
    }

    // TODO handle modifying date

    commitChanges(e) {
        if (e !== undefined && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }

        if (Object.keys(this.state.changes).length === 0) {
            return;
        }

        const changesSnapshot = this.state.changes;
        const fieldsChanged = {};

        Object.keys(changesSnapshot).forEach((id) => {
            const { userId, date } = this.idToUserAndDate[id];

            const points =
                [
                    this.state.userPoints[userId][date].points_punktualnosc,
                    this.state.userPoints[userId][date].points_przygotowanie,
                    this.state.userPoints[userId][date].points_skupienie,
                    this.state.userPoints[userId][date].points_efekt,
                ];

            const cPoints = changesSnapshot[id];
            fieldsChanged[id] = [0, 1, 2, 3].map(index => points[index] !== cPoints[index]);
        });

        this.setState({ changes: {}, ongoingChanges: fieldsChanged });

        const data = new FormData();

        Object.keys(changesSnapshot).forEach((id) => {
            data.append(id, changesSnapshot[id]);
        });

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/modify_points', true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            try {
                const uploadResponse = JSON.parse(xhr.responseText);
                if (uploadResponse.ok !== undefined) {
                    const savedChanges = { ...this.state.savedChanges };
                    Object.keys(fieldsChanged).forEach((id) => {
                        // if it was already changed and saved before
                        if (savedChanges[id] !== undefined) {
                            savedChanges[id] = savedChanges[id].map(
                                (isChanged, index) => fieldsChanged[id][index] || isChanged);
                        } else {
                            savedChanges[id] = fieldsChanged[id];
                        }
                    });
                    // TODO prevent multiple ongoing commits

                    const userPoints = { ...this.state.userPoints };

                    Object.keys(changesSnapshot).forEach((id) => {
                        const { userId, date } = this.idToUserAndDate[id];

                        [userPoints[userId][date].points_punktualnosc,
                            userPoints[userId][date].points_przygotowanie,
                            userPoints[userId][date].points_skupienie,
                            userPoints[userId][date].points_efekt,
                        ] = changesSnapshot[id];
                    });
                    this.setState({
                        ongoingChanges: {},
                        savedChanges: { ...savedChanges },
                        userPoints: { ...userPoints },
                    });
                    // this.props.databaseObjects.refreshDatabase('users');
                } else {
                    // re-add changes
                    console.log('reverting changes');
                    const changes = { ...this.state.changes };
                    Object.keys(fieldsChanged).forEach((id) => {
                        // if it was already changed and saved before
                        if (changes[id] !== undefined) {
                            changes[id] = fieldsChanged[id].map(
                                (isChanged, index) => changes[id][index] ^ isChanged);
                        } else {
                            changes[id] = changesSnapshot[id];
                        }
                    });
                    this.setState({ changes: { ...changes }, ongoingChanges: {} });
                }
            } catch (reqErr) {
                // re-add changes
                console.log('reverting changes');
                const changes = { ...this.state.changes };
                Object.keys(fieldsChanged).forEach((id) => {
                    // if it was already changed and saved before
                    if (changes[id] !== undefined) {
                        changes[id] = fieldsChanged[id].map(
                            (isChanged, index) => changes[id][index] ^ isChanged);
                    } else {
                        changes[id] = changesSnapshot[id];
                    }
                });
                this.setState({ changes: { ...changes }, ongoingChanges: {} });
            }
        };
        xhr.send(data);
    }

    handlePointsToggle(id, index) {
        const changes = { ...this.state.changes };

        if (changes[id] === undefined) {
            const { userId, date } = this.idToUserAndDate[id];
            console.log(id, userId, date);
            changes[id] = [
                this.state.userPoints[userId][date].points_punktualnosc,
                this.state.userPoints[userId][date].points_przygotowanie,
                this.state.userPoints[userId][date].points_skupienie,
                this.state.userPoints[userId][date].points_efekt,
            ];
        }

        changes[id][index] ^= 1;
        this.setState({ changes: { ...changes } });
    }

    updateNewDate(id, e) {
        const tmpNewDates = this.state.newDates;
        tmpNewDates[id].date = e.target.value;
        this.setState({ newDates: { ...tmpNewDates } });
    }

    prepareTable() {
        const table1Head1 = [];
        const table1Head2 = [];

        console.log('aaaaaaaaaaaaaaa');
        Object.keys(this.props.databaseObjects.users).forEach((user) => {
            Object.keys(this.props.databaseObjects.users[user].points).forEach((date) => {
                const tmpDate = new Date(date);
                // const parsedDate = `${tmpDate.getMonth()+1}.${tmpDate.getDate()}`;
                datesTmp[tmpDate] = 1;
            });
        });

        console.log('aaaaaaaaaaaaaaa23434324');
        const dates = Object.keys(datesTmp).sort((a, b) => (new Date(a)) - (new Date(b)));

        // console.log(dates);

        table1Head1.push(<th colSpan={2}>Gracz</th>);

        dates.forEach((date) => {
            const tmpDate = new Date(date);
            const parsedDate = `${tmpDate.getDate()}.${`0${(tmpDate.getMonth() + 1)}`.slice(-2)}.${tmpDate.getFullYear()}`;
            table2Head1.push(<th colSpan={4}>{parsedDate}</th>);
        });

        Object.keys(this.state.newDates).forEach((id) => {
            table2Head1.push(<th colSpan={4}>
                <input type="date" onChange={e => this.updateNewDate(id, e)} />
            </th>);
        });

        table1Head2.push(<th>Imię</th>);
        table1Head2.push(<th>Nazwisko</th>);

        dates.forEach(() => {
            table2Head2.push(<span><th className="points-first">P</th><th>Pr</th><th>S</th><th className="points-last">E</th></span>);
            // table2Head2.push(<th>Pr</th>);
            // table2Head2.push(<th>S</th>);
            // table2Head2.push(<th className="points-last">E</th>);
        });

        Object.keys(this.state.newDates).forEach(() => {
            table2Head2.push(<th className="points-first">P</th>);
            table2Head2.push(<th>Pr</th>);
            table2Head2.push(<th>S</th>);
            table2Head2.push(<th className="points-last">E</th>);
        });


        table2Head1.push(
            <th
                id="table-enter-new-date"
                colSpan={4}
                onClick={() => {
                    const table = document.getElementById('scrollable-table');
                    table.scrollLeft = table.scrollWidth;

                    this.setState({ newDates: {
                        ...this.state.newDates,
                        [Object.keys(this.state.newDates).length + 1]: {},
                    } });
                }}
            >
                <i className="fa fa-plus" />
            </th>);

        table2Head2.push(<th className="points-first">P</th>);
        table2Head2.push(<th>Pr</th>);
        table2Head2.push(<th>S</th>);
        table2Head2.push(<th className="points-last">E</th>);

        const table1Content = [];

        const table2Content = Object.keys(this.props.databaseObjects.users).map((userId) => {
            const user = this.props.databaseObjects.users[userId];
            const values = [];

            const values1 = [];

            values1.push(<th>{user.name}</th>);
            values1.push(<th>{user.surname}</th>);

            table1Content.push(<tr>{values1}</tr>);

            dates.forEach((date) => {
                if (user.points[date] === undefined) {
                    user.points[date] = {};
                    user.points[date].points_punktualnosc = 0;
                    user.points[date].points_przygotowanie = 0;
                    user.points[date].points_skupienie = 0;
                    user.points[date].points_efekt = 0;
                }
                if (this.state.changes[date] === undefined
                    || this.state.changes[date][userId] === undefined) {
                    values.push(
                        <td
                            className={'points-vals points-first'}
                            onDoubleClick={() => this.handlePointsToggle(userId, date, 0)}
                        >
                            {user.points[date] === undefined
                                ? 0 : user.points[date].points_punktualnosc}
                        </td>);
                    values.push(
                        <td
                            className={'points-vals'}
                            onDoubleClick={() => this.handlePointsToggle(userId, date, 1)}
                        >
                            {user.points[date] === undefined
                                ? 0 : user.points[date].points_przygotowanie}
                        </td>);
                    values.push(
                        <td
                            className={'points-vals'}
                            onDoubleClick={() => this.handlePointsToggle(userId, date, 2)}
                        >
                            {user.points[date] === undefined
                                ? 0 : user.points[date].points_skupienie}
                        </td>);
                    values.push(
                        <td
                            className={'points-vals points-last'}
                            onDoubleClick={() => this.handlePointsToggle(userId, date, 3)}
                        >
                            {user.points[date] === undefined
                                ? 0 : user.points[date].points_efekt}
                        </td>);
                } else {
                    values.push(
                        <td
                            className={`points-vals points-first ${((this.state.changes[date][userId] & 1) > 0) ? 'points-changed' : ''}`}
                            onDoubleClick={() => this.handlePointsToggle(userId, date, 0)}
                        >
                            {user.points[date].points_punktualnosc
                                ^ (this.state.changes[date][userId] & 1)}
                        </td>);
                    values.push(
                        <td
                            className={`points-vals ${((this.state.changes[date][userId] & (1 << 1)) > 0) ? 'points-changed' : ''}`}
                            onDoubleClick={() => this.handlePointsToggle(userId, date, 1)}
                        >
                            {user.points[date].points_przygotowanie
                                ^ ((this.state.changes[date][userId] & (1 << 1)) >>> 1)}
                        </td>);
                    values.push(
                        <td
                            className={`points-vals ${((this.state.changes[date][userId] & (1 << 2)) > 0) ? 'points-changed' : ''}`}
                            onDoubleClick={() => this.handlePointsToggle(userId, date, 2)}
                        >
                            {user.points[date].points_skupienie
                                ^ ((this.state.changes[date][userId] & (1 << 2)) >>> 2)}
                        </td>);
                    values.push(
                        <td
                            className={`points-vals points-last ${((this.state.changes[date][userId] & (1 << 3)) > 0) ? 'points-changed' : ''}`}
                            onDoubleClick={() => this.handlePointsToggle(userId, date, 3)}
                        >
                            {user.points[date].points_efekt
                                ^ ((this.state.changes[date][userId] & (1 << 3)) >>> 3)}
                        </td>);
                }
            });

            // Object.keys(this.state.newDates).forEach((id) => {
            //     if (this.state.newDates[id][userId] === undefined) {
            //         this.state.newDates[id][userId] = {};
            //         this.state.newDates[id][userId].points_punktualnosc = 0;
            //         this.state.newDates[id][userId].points_przygotowanie = 0;
            //         this.state.newDates[id][userId].points_skupienie = 0;
            //         this.state.newDates[id][userId].points_efekt = 0;
            //     }
            //     values.push(
            //         <td
            //             className={'points-vals points-first'}
            //             onDoubleClick={() => this.handleNewPointsToggle(userId, id, 0)}
            //         >
            //             {user.points[date] === undefined
            //                 ? 0 : user.points[date].points_punktualnosc}
            //         </td>);
            //     values.push(
            //         <td
            //             className={'points-vals'}
            //             onDoubleClick={() => this.handlePointsToggle(userId, date, 1)}
            //         >
            //             {user.points[date] === undefined
            //                 ? 0 : user.points[date].points_przygotowanie}
            //         </td>);
            //     values.push(
            //         <td
            //             className={'points-vals'}
            //             onDoubleClick={() => this.handlePointsToggle(userId, date, 2)}
            //         >
            //             {user.points[date] === undefined
            //                 ? 0 : user.points[date].points_skupienie}
            //         </td>);
            //     values.push(
            //         <td
            //             className={'points-vals points-last'}
            //             onDoubleClick={() => this.handlePointsToggle(userId, date, 3)}
            //         >
            //             {user.points[date] === undefined
            //                 ? 0 : user.points[date].points_efekt}
            //         </td>);
            // });

            return (<tr>{values}</tr>);
        });

        this.table1 = (
            <table className="table table-dark table-hover points-table">
                <thead>
                    <tr>
                        {table1Head1}
                    </tr>
                    <tr>
                        {table1Head2}
                    </tr>
                </thead>
                <tbody>{table1Content}</tbody>
            </table>
        );

        this.table2 = (
            <table className="table table-dark table-hover">
                <thead>
                    <tr>
                        {table2Head1}
                    </tr>
                    <tr>
                        {table2Head2}
                    </tr>
                </thead>
                <tbody>{table2Content}</tbody>
            </table>
        );
    }

    render() {
        const pointsTable = this.state.dates.map((date) => {
            const changesList = {};
            const pointsArr = Object.keys(this.state.userPoints).map((userId) => {
                const id = this.state.userPoints[userId][date].id;

                const points =
                    [
                        this.state.userPoints[userId][date].points_punktualnosc,
                        this.state.userPoints[userId][date].points_przygotowanie,
                        this.state.userPoints[userId][date].points_skupienie,
                        this.state.userPoints[userId][date].points_efekt,
                    ];

                if (this.state.changes[id] !== undefined) {
                    const cPoints = this.state.changes[id];
                    changesList[id] = [0, 1, 2, 3].map(index => points[index] !== cPoints[index]);
                }

                return { id, points: this.state.changes[id] || points };
            });

            const tmpDate = new Date(date);
            const parsedDate = `${tmpDate.getDate()}.${`0${(tmpDate.getMonth() + 1)}`.slice(-2)}.${tmpDate.getFullYear()}`;

            return (<AdminPointsMainTable
                headerDate={parsedDate}
                dataArray={pointsArr}
                valuesOnEdit={this.handlePointsToggle}
                changesList={changesList}
                ongoingChanges={this.state.ongoingChanges}
                savedChanges={this.state.savedChanges}
            />);
        });

        const playersTableContent = Object.keys(this.props.databaseObjects.users).map((userId) => {
            const user = this.props.databaseObjects.users[userId];

            if (user.role === 'admin') {
                return undefined;
            }

            return (
                <tr>
                    <th>{user.name}</th>
                    <th>{user.surname}</th>
                </tr>
            );
        }).filter(val => val !== undefined);

        return (
            <div className="container bg-dark text-light tables-container" style={{ textAlign: 'center' }}>
                <div style={{ whiteSpace: 'nowrap' }}>
                    <table className="table table-dark table-hover">
                        <thead>
                            <tr>
                                <th colSpan={2}>Gracz</th>
                            </tr>
                            <tr>
                                <th>Imię</th>
                                <th>Nazwisko</th>
                            </tr>
                        </thead>
                        <tbody>
                            {playersTableContent}
                        </tbody>
                    </table>
                </div>
                <div className="points-table-container" id="scrollable-table">
                    {pointsTable}
                </div>
            </div>

        );
    }
}

AdminPoints.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
