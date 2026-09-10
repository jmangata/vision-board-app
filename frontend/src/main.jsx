// Point d'entrée de l'application React (build Vite).
// Monte le composant racine App dans la div #root de index.html,
// avec le routeur côté client (BrowserRouter).
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode : active des vérifications supplémentaires en développement
  // (double appel des effets, détection de pratiques dépréciées)
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);