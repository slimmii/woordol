import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { persistor, store } from './store';
import { Provider } from 'react-redux';
import * as serviceWorker from './serviceWorker';
import { PersistGate } from 'redux-persist/lib/integration/react';
import ReactGA from 'react-ga';

ReactGA.initialize("UA-54325446-16");
ReactGA.pageview(window.location.pathname);


ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
      <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
