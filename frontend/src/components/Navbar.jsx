import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload();
  };

  return (
    <nav className="bg-indigo-600 text-white p-4 shadow">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">Vision Board</Link>
        <div className="space-x-4">
          {token ? (
            <>
              <Link to="/">Mes objectifs</Link>
              <Link to="/dashboard">Tableau de bord</Link>
              <Link to="/goals/new">Nouvel objectif</Link>
              <button onClick={logout} className="underline">Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login">Connexion</Link>
              <Link to="/register">Inscription</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 
