import '../../styles/App.css';
import neu from '../../assets/images/northeastern.jpg';
import React, { useState, useEffect } from 'react';
import { useAuthUser } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import jobImage from '../../assets/images/login_image.jpeg';
import { Link } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login, error_call, isAuthenticated } = useAuthUser();
  const navigate = useNavigate();

  // Fix: navigate in useEffect instead of during render
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/joblist');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Both email and password are required!');
      return;
    }
    const result = await login(email, password);
    if (result.success) {
      navigate('/joblist');
    }
  };

  return (
    <div className="App">
      <div className="container-fluid" id="top-bar">
        <div className="row align-items-center">
          <div className="col-3 text-start">
            <img src={neu} alt="Husky Logo" />
          </div>
          <div className="col-6 text-center">
            <h1 className="Name">Job Portal</h1>
          </div>
          <div className="col-3">
            {/* Reserved for future navigation */}
          </div>
        </div>
      </div>

      <div id="signup" style={{backgroundImage: `url(${jobImage})`}}>
        <div id="signup_in">
          <h2 className="cac">Log in</h2>

          {(error_call || error) &&
            <div className="error-message">
              {error_call || error}
            </div>
          }

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="form-control"
              id="username"
              name="username"
              placeholder="Username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <br />

            <button
              type="submit"
              className="btn"
              id="btn-signup"
            >
              Log in
            </button>
          </form>

          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <p style={{ color: '#666', marginBottom: '15px' }}>Or</p>
            <a
              href="http://localhost:5000/api/auth/google"
              className="btn"
              id="btn-signup"
              style={{ backgroundColor: '#4285F4', borderColor: '#4285F4' }}
            >
              Login with Google
            </a>
          </div>

          <div className="nav-links">
            <p>New user?
              <Link to="/register">
                Sign Up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
