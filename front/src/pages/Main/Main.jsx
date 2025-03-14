import { useState, useEffect, use } from 'react';
import { getUserFromToken, isAuthenticated, logout } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import './Main.css';
import SnakeGame from '../../components/SnakeGame';

function Main() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        console.log('Main component mounted');
        
        // Проверяем, авторизован ли пользователь
        if (!isAuthenticated()) {
            console.log('User is not authenticated, redirecting to login');
            // Используем React Router для перенаправления
            navigate('/login');
            return;
        }
        
        // Получаем данные пользователя из токена
        const userData = getUserFromToken();
        console.log('User data retrieved:', userData);
        setUser(userData);
        
        // Добавляем небольшую задержку для эффекта загрузки
        setTimeout(() => {
            setLoading(false);
        }, 800);
        
        // Предотвращаем скроллинг страницы при нажатии на пробел
        const preventSpaceScroll = (e) => {
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                return false;
            }
        };
        
        // Предотвращаем скроллинг страницы при нажатии на стрелки
        const preventArrowScroll = (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                return false;
            }
        };
        
        window.addEventListener('keydown', preventSpaceScroll);
        window.addEventListener('keydown', preventArrowScroll);
        
        return () => {
            window.removeEventListener('keydown', preventSpaceScroll);
            window.removeEventListener('keydown', preventArrowScroll);
        };
    }, [navigate]);

    // Обработчик для кнопки выхода
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading awesome snake game...</p>
        </div>;
    }

    return (
        <div className="app-container">
            <header className="main-header">
                <div className="logo">
                    <h1>SnakeGame</h1>
                </div>
                <div className="user-window">
                    <img src="/user_nat.jpg" alt="User" className="user-avatar" />
                    <span className="username">
                        {user ? user.sub : 'Guest'}
                    </span>
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </header>
            
            <main className="main-content">
                <div className="game-container">
                    <h2>Snake Game</h2>
                    <p>Use arrow keys to control the snake. Eat the food to grow longer!</p>
                    <SnakeGame />
                </div>
            </main>
            
            <footer className="main-footer">
                <p>&copy; 2025 SnakeGame. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default Main;