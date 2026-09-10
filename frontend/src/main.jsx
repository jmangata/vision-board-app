// main.jsx : point d'entrée du frontend.
// Il crée la racine React, active le routage côté client et injecte le CSS global.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import '../index.css';

// Montage de l'application dans la balise <div id="root"> du HTML.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);