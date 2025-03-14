import { useState } from 'react';
import './App.css';
import { Link, useNavigate } from 'react-router-dom';
import { parseJwt } from '../../utils/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      const response = await fetch('http://172.19.29.209/api/token/', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful, received tokens:', data);
        
        // Проверяем токен перед сохранением
        const tokenPayload = parseJwt(data.access_token);
        console.log('Decoded token payload:', tokenPayload);
        
        if (!tokenPayload) {
          setFormError('Invalid token received from server');
          return;
        }
        
        // Записываем токены в куки с явным указанием пути и срока действия
        const expiryDate = new Date();
        expiryDate.setTime(expiryDate.getTime() + 24 * 60 * 60 * 1000); // 1 день
        
        
        // Альтернативный вариант - использовать localStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('token_type', data.token_type);
        console.log('Tokens saved to localStorage');
        
        // Добавляем небольшую задержку перед перенаправлением
        setTimeout(() => {
          console.log('Checking cookies before redirect:', document.cookie);
          navigate('/main');
        }, 100);
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        setFormError(errorData.detail || 'Invalid email or password.');
      }
    } catch (error) {
      console.error('Network error during login:', error);
      setFormError('Network error. Please try again later.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-form">
          <h1>Sign in to YourApp</h1>
          
          {formError && (
            <div className="form-error">
              • {formError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            
            <div className="forgot-password">
              <a href="#">Forgot password?</a>
            </div>
            
            <button type="submit" className="submit-button">Sign In</button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </div>
          
          <div className="recaptcha-notice">
            This site is protected by reCAPTCHA and the Google <a href="#">Privacy Policy</a> and <a href="#">Terms of Service</a> apply.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; 