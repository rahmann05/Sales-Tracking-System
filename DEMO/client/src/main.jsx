import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../../../client/src/App';
import '../../../client/src/index.css';
import 'leaflet/dist/leaflet.css';
import './styles/DemoDock.css';
import { DemoDock } from './components/DemoDock';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <DemoDock />
  </React.StrictMode>
);
