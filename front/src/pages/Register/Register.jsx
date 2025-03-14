import './App.css'
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseJwt } from '../../utils/auth';

function Register() {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Sign up to play";

    const checkUsername = async () => {
      if (username) {
        const response = await fetch(`http://127.0.0.1:8000/check-username?username=${username}`);
        if (response.ok) {
          const data = await response.json();
          setUsernameError(data.available ? '' : 'Username is already taken.');
          if (!data.available) {
            setFormError('Username is already taken.');
          } else {
            setFormError('');
          }
        } else {
          setUsernameError('Error checking username.');
        }
      } else {
        setUsernameError('');
      }
    };

    const checkEmail = async () => {
      if (email) {
        const response = await fetch(`http://127.0.0.1:8000/check-email?email=${email}`);
        if (response.ok) {
          const data = await response.json();
          setEmailError(data.available ? '' : 'Email is already taken.');
        } else {
          setEmailError('Error checking email.');
        }
      } else {
        setEmailError('');
      }
    };

    // Используем debounce для уменьшения количества запросов
    const timer = setTimeout(() => {
      if (username) checkUsername();
      if (email) checkEmail();
    }, 500);

    return () => clearTimeout(timer);
  }, [username, email]);

  const validatePassword = () => {
    if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters long.');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    validatePassword();

    if (!username) {
      setUsernameError('Username can\'t be blank');
      setFormError('Username can\'t be blank');
      return;
    }

    if (usernameError || emailError || passwordError || !termsAccepted) {
      if (!termsAccepted) {
        setFormError('Please accept the terms and conditions.');
      } else if (usernameError) {
        setFormError('Username is already taken.');
      } else if (emailError) {
        setFormError('Email is already taken.');
      } else if (passwordError) {
        setFormError('Password must be at least 4 characters long.');
      }
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful, received tokens:', data);
        
        // Проверяем токен перед сохранением
        if (data.access_token) {
          const tokenPayload = parseJwt(data.access_token);
          console.log('Decoded token payload:', tokenPayload);
          
          if (!tokenPayload) {
            setFormError('Invalid token received from server');
            return;
          }
          
          // Кодируем токены для безопасного хранения в cookie
          const encodedAccessToken = encodeURIComponent(data.access_token);
          const encodedRefreshToken = encodeURIComponent(data.refresh_token);
          
          // Записываем токены в куки с явным указанием пути и срока действия
          const expiryDate = new Date();
          expiryDate.setTime(expiryDate.getTime() + 24 * 60 * 60 * 1000); // 1 день
          
          document.cookie = `access_token=${encodedAccessToken}; path=/; expires=${expiryDate.toUTCString()}`;
          document.cookie = `refresh_token=${encodedRefreshToken}; path=/; expires=${expiryDate.toUTCString()}`;
          document.cookie = `token_type=${data.token_type}; path=/; expires=${expiryDate.toUTCString()}`;
          
          console.log('Cookies set:', document.cookie);
          
          // Сохраняем токены в localStorage
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          localStorage.setItem('token_type', data.token_type);
          console.log('Tokens saved to localStorage');
          
          // Перенаправляем на главную страницу
          setTimeout(() => {
            navigate('/main');
          }, 100);
        } else {
          // Если токены не получены, просто показываем сообщение об успешной регистрации
          alert('Registration successful! Please log in.');
          navigate('/login');
        }
      } else {
        const errorData = await response.json();
        setFormError(errorData.detail || 'Registration failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setFormError('Network error. Please try again later.');
    }
  };

  // Проверяем, содержит ли email "@gmail.com"
  const isGmailAccount = email && email.toLowerCase().includes('@gmail.com');

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-form">
          <h1>Sign up to YourApp</h1>
          
          {name && isGmailAccount && (
            <div className="account-info">
              Your Google account {name} will be connected to your new YourApp account.
              <div><a href="#">Wrong identity? Start over.</a></div>
            </div>
          )}
          
          {formError && (
            <div className="form-error">
              • {formError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>

            <div className="name-group">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">
                  Username
                  {usernameError && <span className="error-icon">⚠️</span>}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={usernameError ? 'error-field' : ''}
                  autoComplete="username"
                />
              </div>
              
            </div>
            
            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={emailError ? 'error-field' : ''}
                  autoComplete="email"
                />
              </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="6+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={validatePassword}
                className={passwordError ? 'error-field' : ''}
                autoComplete="new-password"
              />
            </div>
            
            <div className="terms-checkbox">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <label htmlFor="terms">
                I agree with YourApp's <a href="#">Terms of Service</a>, <a href="#">Privacy Policy</a>, and default <a href="#">Notification Settings</a>.
              </label>
            </div>
            
            <button type="submit" className="submit-button">Create Account</button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
          
          <div className="recaptcha-notice">
            This site is protected by reCAPTCHA and the Google <a href="#">Privacy Policy</a> and <a href="#">Terms of Service</a> apply.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;