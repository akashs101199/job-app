import '../../styles/App.css';
import neu from '../../assets/images/northeastern.jpg';
import jobImage from '../../assets/images/login_image.jpeg';
import { useAuthUser } from '../../context/AuthContext';
import RadioButtons from '../../components/shared/RadioButtons';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');

  const { register, error_call } = useAuthUser();
  const navigate = useNavigate();
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const today = new Date();
    const dob_inter = new Date(dob);
    let age = today.getFullYear() - dob_inter.getFullYear();
    const monthDifference = today.getMonth() - dob_inter.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob_inter.getDate())) {
      age--;
    }

    setError('');

    if (!email || !password || !firstName || !lastName || !dob) {
      setError('Fill in all fields!');
      return;
    }

    if(age < 18) {
      setError('Age must be greater than 18');
      return;
    }

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email!');
      return;
    }

    if(password.includes(email) || password.length < 8) {
      setError('Password should not contain username or password should be greater than 8');
      return;
    }

    const result = await register(email, password, firstName, lastName, dob);
    if (result.success) {
      navigate('/login');
    } else {
      setError(result.message || 'Registration failed');
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
          <h2 className="cac">Create an Account</h2>

          {(error || error_call) &&
            <div className="error-message">
              {error || error_call}
            </div>
          }

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="form-control"
              id="FirstName"
              name="FirstName"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            <input
              type="text"
              className="form-control"
              id="LastName"
              name="LastName"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />

            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="text"
              className="form-control"
              name="Id"
              placeholder="Enter your Mail Id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="date"
              className="form-control"
              name="Id"
              placeholder="Enter your DOB"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />

            <RadioButtons />

            <br />

            <button
              type="submit"
              className="btn"
              id="btn-signup"
            >
              Sign Up
            </button>
          </form>

          <div className="nav-links">
            <p>Already have an account?
              <Link to="/login">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
