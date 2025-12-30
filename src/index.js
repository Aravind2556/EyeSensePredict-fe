import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './css/index.css';
import './css/globals.css';
import App from './App';
import DataContext from './context/Datacontext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <DataContext>
            <App />
        </DataContext>
    </BrowserRouter>
);

