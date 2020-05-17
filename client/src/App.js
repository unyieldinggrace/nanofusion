import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import './bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Home from './components/pages/Home';
import Session from './components/pages/Session';

class App extends Component {
    render() {
       return (
                <BrowserRouter>
                    <Switch>
                        <Route exact path='/' component={Home}/>
                        <Route path='/session' component={Session}/>
                    </Switch>
                </BrowserRouter>
        );
    }
}

export default App;
