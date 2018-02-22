import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RandomString from 'randomstring';

import AdminPointsMainTable from './AdminPointsMainTable';
import './AdminPoints.scss';

function zeroPad(a) {
    return `0${a}`.slice(-2);
}

function dateToISOString(date) {
    const dateObj = new Date(date);
    const dateString = `${dateObj.getFullYear()}_` +
        `${zeroPad(dateObj.getMonth() + 1)}_${zeroPad(dateObj.getDate())}`;

    return dateString;
}

export default class AdminPoints extends Component {
    constructor(props) {
        super(props);

        this.state = {
            dates: [],
            userPoints: {},
            changes: {},
            savedChanges: {},
            ongoingChanges: {},
            addNewDatePanelVisible: false,
            newPointsArray: [],
            hoveredRow: undefined,
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
        this.deleteDate = this.deleteDate.bind(this);
        this.changeDate = this.changeDate.bind(this);
        this.handleNewPointsToggle = this.handleNewPointsToggle.bind(this);
        this.handleNewPointsSave = this.handleNewPointsSave.bind(this);
        this.rowMouseEntered = this.rowMouseEntered.bind(this);
        this.rowMouseLeft = this.rowMouseLeft.bind(this);

        this.commitIntervalId = setInterval(this.commitChanges, 10000);
    }

    componentWillReceiveProps(nextProps) {
        this.idToUserAndDate = {};

        Object.keys(nextProps.databaseObjects.users).forEach((userId) => {
            console.log(nextProps.databaseObjects.users[userId].role);
            if (nextProps.databaseObjects.users[userId].role === 'admin') {
                return;
            }

            this.state.userPoints[userId] = {};
            Object.keys(nextProps.databaseObjects.users[userId].points).forEach((date) => {
                const tmpDate = (new Date(date)).valueOf();

                if (!this.state.dates.includes(tmpDate)) {
                    this.state.dates.push(tmpDate);
                }

                const id = nextProps.databaseObjects.users[userId].points[date].id;

                this.idToUserAndDate[id] = { userId, date: tmpDate };

                this.state.userPoints[userId][tmpDate] =
                    { ...nextProps.databaseObjects.users[userId].points[date] };
            });
        });

        this.state.dates = this.state.dates.sort((a, b) => (new Date(a)) - (new Date(b)));
    }

    componentWillUnmount() {
        this.props.databaseObjects.refreshDatabase('users');
        clearInterval(this.commitIntervalId);
    }

    handleField(fieldName, event) {
        console.log(fieldName, event.target.value);
        this.setState({ [fieldName]: event.target.value });
    }

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

    deleteDate(tmpDateToRemove) {
        const dateToRemove = new Date(tmpDateToRemove);

        const dateString = dateToISOString(tmpDateToRemove);

        const reqString = `/delete_points_from_date?date=${dateString}`;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', reqString, true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            try {
                const uploadResponse = JSON.parse(xhr.responseText);
                if (uploadResponse.ok !== undefined) {
                    const dates = [...this.state.dates];
                    const filteredDates = dates.filter(date =>
                        (new Date(date)).valueOf() !== dateToRemove.valueOf());

                    this.setState({ dates: filteredDates });
                } else {
                    // TODO print some error
                    /**/
                }
            } catch (reqErr) {
                /**/
            }
        };
        xhr.send();
    }

    changeDate(oldDate, newDate) {
        const oldDateString = dateToISOString(oldDate);

        const newDateString = dateToISOString(newDate);

        const reqString = `/change_points_date?oldDate=${oldDateString}&newDate=${newDateString}`;

        console.log(reqString);

        const xhr = new XMLHttpRequest();
        xhr.open('GET', reqString, true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            try {
                const uploadResponse = JSON.parse(xhr.responseText);
                if (uploadResponse.ok !== undefined) {
                    const dates = [...this.state.dates];
                    const updatedDates = dates.map((date) => {
                        if ((new Date(date)).valueOf() === (new Date(oldDate)).valueOf()) {
                            return (new Date(newDate)).valueOf();
                        }
                        return date;
                    });

                    const userPoints = { ...this.state.userPoints };

                    Object.keys(userPoints).forEach((userId) => {
                        userPoints[userId][(new Date(newDate)).valueOf()]
                            = userPoints[userId][(new Date(oldDate)).valueOf()];
                    });

                    this.setState({ dates: updatedDates, userPoints: { ...userPoints } });
                } else {
                    // TODO print some error
                    /**/
                }
            } catch (reqErr) {
                /**/
            }
        };
        xhr.send();
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

    handleNewPointsToggle(id, index) {
        const newPointsArray = [...this.state.newPointsArray];

        newPointsArray[id.split('_')[0]].points[index] ^= 1;

        this.setState({ newPointsArray });
    }

    updateNewDate(id, e) {
        const tmpNewDates = this.state.newDates;
        tmpNewDates[id].date = e.target.value;
        this.setState({ newDates: { ...tmpNewDates } });
    }

    startAddingNewPoints() {
        const emptyArr = Object.keys(this.state.userPoints).map((userId, index) =>
            ({ id: `${index}_${RandomString.generate(24)}`, userId, points: [1, 0, 0, 0] }));

        this.setState({ newPointsArray: [...emptyArr], addNewDatePanelVisible: true });
    }

    handleNewPointsSave(a, newDate) {
        const data = new FormData();

        data.append('newDate', dateToISOString(newDate));

        this.state.newPointsArray.forEach((row) => {
            data.append(row.userId, row.points);
        });

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/add_points', true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            try {
                const uploadResponse = JSON.parse(xhr.responseText);
                if (uploadResponse.ok !== undefined) {
                    this.setState({ addNewDatePanelVisible: false });
                    this.props.databaseObjects.refreshDatabase('users');
                } else {
                   // add some error info
                }
            } catch (reqErr) {
                // add some error info
            }
        };
        xhr.send(data);
    }

    rowMouseEntered(rowId) {
        this.setState({ hoveredRow: rowId });
    }

    rowMouseLeft(rowId) {
        if (this.state.hoveredRow === rowId) {
            this.setState({ hoveredRow: undefined });
        }
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

            return (<AdminPointsMainTable
                headerDate={date}
                dataArray={pointsArr}
                valuesOnEdit={this.handlePointsToggle}
                changesList={changesList}
                ongoingChanges={this.state.ongoingChanges}
                savedChanges={this.state.savedChanges}
                onDateDelete={this.deleteDate}
                onDateChange={this.changeDate}
                onMouseEnter={this.rowMouseEntered}
                onMouseLeave={this.rowMouseLeft}
                isEditable
            />);
        });

        let rowCounter = 0;

        const playersTableContent = Object.keys(this.props.databaseObjects.users).map((userId) => {
            const user = this.props.databaseObjects.users[userId];

            if (user.role === 'admin') {
                return undefined;
            }

            const className = this.state.hoveredRow === rowCounter ? 'name-hovered' : '';

            rowCounter++;

            return (
                <tr className={className}>
                    <th>{user.name}</th>
                    <th>{user.surname}</th>
                </tr>
            );
        }).filter(val => val !== undefined);

        const newPointsDivStyle = {
            width: `${this.state.addNewDatePanelVisible ? 250 : 50}px`,
        };

        return (
            <div>
                <h1 style={{ textAlign: 'center' }}>Punkty</h1>
                <div className="container bg-dark text-light tables-container">
                    <div style={{ whiteSpace: 'nowrap' }}>
                        <table className="table table-dark table-hover table-names">
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
                    <div className="new-points-container" style={newPointsDivStyle}>
                        <div
                            className="new-points-table"
                            style={{ width: `${this.state.addNewDatePanelVisible ? 250 : 0}px` }}
                        >
                            <AdminPointsMainTable
                                dataArray={this.state.newPointsArray}
                                onDateDelete={() =>
                                    this.setState({ addNewDatePanelVisible: false })}
                                valuesOnEdit={this.handleNewPointsToggle}
                                onDateChange={this.handleNewPointsSave}
                                onMouseEnter={this.rowMouseEntered}
                                onMouseLeave={this.rowMouseLeft}
                                isEditable
                            />
                        </div>
                        <div
                            className="new-points-toggle-button"
                            style={{ width: `${this.state.addNewDatePanelVisible ? 0 : 50}px` }}
                            onClick={() => this.startAddingNewPoints()}
                        >
                            <i className="fa fa-plus" />
                        </div>
                    </div>
                </div>
                <div className="container points-instruction-container">
                    <h3>Instrukcja obsługi:</h3> <br />
                    <h4>Dodawanie punktów:</h4>
                    Aby dodać nowe punkty, należy nacisnąć na <i className="fa fa-plus" /> po
                    prawej stronie tabeli, następnie w nagłówku ustawić datę
                    naciskając kolejno <i className="fa fa-plus" />, wybierając
                    odpowiednią datę i potwierdzając wybór <i className="fa fa-check" />.
                    Po ustawieniu daty należy ustawić wartości punktów dla poszczególnych graczy.
                    Wartości można przełączać pomiędzy 0 a 1 klikając dwukrotnie na
                    wybranej komórce tabeli.
                    Po zakończonym wprowadzaniu punktów zmiany należy zapisać
                    używając <i className="fa fa-save" />.
                    Po udanym zapisie boczny panel powinien się automatycznie zamknąć,
                    a nowa kolumna powinna zostać dodana do głównej tabeli.
                    Jeśli tak się nie stanie, oznacza to że zapis nie powiódł się,
                    należy przede wszystkim sprawdzić, czy nie istnieje już kolumna
                    z podaną datą.
                    <br /><br />
                    <h4>Edycja punktów:</h4>
                    Aby zmienić wartość punktów w głównej tabeli, należy dwukrotnie kliknąć
                    na wybranej komórce. Zmieniona komórka podświetli się
                    na <span className="points-changed">czerwono</span>.
                    Zmiany są zapisywane automatycznie co 10s, w trakcie zapisu kolor komórki
                    zmienia się
                    na <span className="points-ongoing">żółty</span>,
                    a po udanym zapisie na <span className="points-saved">zielony</span>.
                    <br /><br />
                    <h4>Edycja daty/usuwanie danych:</h4>
                    Aby wyedytować datę kolumny danych, należy najechać na tą kolumnę
                    myszką i nacisnąć przycisk <i className="fa fa-edit" />, a następnie
                    ustawić datę i zapisać zmiany klikając <i className="fa fa-check" />.
                    Edycję można anulować naciskając <i className="fa fa-times" />. <br />
                    Naciśnięcie <i className="fa fa-trash" /> spowoduje usunięcie całej kolumny
                    danych, po uprzednim potwierdzeniu tej operacji.
                    <br /><br />
                </div>
            </div>
        );
    }
}

AdminPoints.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
