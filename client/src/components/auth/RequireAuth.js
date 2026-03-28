import { Navigate } from 'react-router-dom';
import { useAuthUser } from '../../context/AuthContext';

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuthUser();

  if (loading) {
    return (
      <div className="spinner-grow" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return children;
}

export default RequireAuth;
