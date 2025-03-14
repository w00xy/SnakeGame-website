import { useState, useEffect, useRef } from 'react';
import './SnakeGame.css';

// Уменьшаем размер сетки и ячеек для лучшего размещения на экране
const GRID_SIZE = 20;
const CELL_SIZE = 18; // Уменьшаем размер ячейки
const INITIAL_SPEED = 150;

function SnakeGame() {
    const canvasRef = useRef(null);
    const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
    const [food, setFood] = useState({ x: 15, y: 15 });
    const [direction, setDirection] = useState('RIGHT');
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [isPaused, setIsPaused] = useState(true); // Начинаем с паузы
    const [speed, setSpeed] = useState(INITIAL_SPEED);
    
    // Ref для хранения текущего направления
    const directionRef = useRef(direction);
    
    // Обновляем ref при изменении direction
    useEffect(() => {
        directionRef.current = direction;
    }, [direction]);
    
    // Генерация случайной позиции для еды
    const generateFood = () => {
        // Создаем карту занятых змейкой позиций для быстрой проверки
        const snakePositions = new Set();
        snake.forEach(segment => {
            snakePositions.add(`${segment.x},${segment.y}`);
        });
        
        // Находим все свободные позиции на поле
        const freePositions = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!snakePositions.has(`${x},${y}`)) {
                    freePositions.push({ x, y });
                }
            }
        }
        
        // Если свободных позиций нет, возвращаем позицию за пределами поля
        // (это не должно произойти в нормальной игре, но на всякий случай)
        if (freePositions.length === 0) {
            return { x: -1, y: -1 };
        }
        
        // Выбираем случайную свободную позицию
        const randomIndex = Math.floor(Math.random() * freePositions.length);
        return freePositions[randomIndex];
    };
    
    // Инициализация еды при первом рендере
    useEffect(() => {
        setFood(generateFood());
    }, []);
    
    // Обработка нажатий клавиш
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Предотвращаем скроллинг страницы при нажатии на клавиши управления
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            // Если игра окончена, пробел перезапускает игру
            if (e.key === ' ' && gameOver) {
                resetGame();
                return;
            }
            
            // Если игра не окончена, обрабатываем клавиши как обычно
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (directionRef.current !== 'DOWN') setDirection('UP');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (directionRef.current !== 'UP') setDirection('DOWN');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (directionRef.current !== 'RIGHT') setDirection('LEFT');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (directionRef.current !== 'LEFT') setDirection('RIGHT');
                    break;
                case ' ':
                    // Пробел для паузы (только если игра не окончена)
                    if (!gameOver) {
                        setIsPaused(prev => !prev);
                    }
                    break;
                default:
                    break;
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gameOver]); // Добавляем gameOver в зависимости
    
    // Логика движения змейки
    useEffect(() => {
        if (gameOver || isPaused) return;
        
        const moveSnake = () => {
            setSnake(prevSnake => {
                // Определяем новую позицию головы
                const head = { ...prevSnake[0] };
                
                switch (direction) {
                    case 'UP':
                        head.y -= 1;
                        break;
                    case 'DOWN':
                        head.y += 1;
                        break;
                    case 'LEFT':
                        head.x -= 1;
                        break;
                    case 'RIGHT':
                        head.x += 1;
                        break;
                    default:
                        break;
                }
                
                // Проверяем столкновение со стеной
                if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                    setGameOver(true);
                    return prevSnake;
                }
                
                // Проверяем столкновение с самой собой
                for (let i = 0; i < prevSnake.length; i++) {
                    if (prevSnake[i].x === head.x && prevSnake[i].y === head.y) {
                        setGameOver(true);
                        return prevSnake;
                    }
                }
                
                // Создаем новую змейку
                const newSnake = [head, ...prevSnake];
                
                // Проверяем, съела ли змейка еду
                if (head.x === food.x && head.y === food.y) {
                    // Генерируем новую еду
                    setFood(generateFood());
                    
                    // Увеличиваем счет
                    setScore(prevScore => prevScore + 1);
                    
                    // Увеличиваем скорость каждые 5 очков
                    if ((score + 1) % 5 === 0 && speed > 50) {
                        setSpeed(prevSpeed => prevSpeed - 10);
                    }
                } else {
                    // Если еда не съедена, удаляем последний сегмент
                    newSnake.pop();
                }
                
                return newSnake;
            });
        };
        
        // Устанавливаем интервал для движения змейки
        const gameInterval = setInterval(moveSnake, speed);
        
        // Очищаем интервал при размонтировании компонента
        return () => clearInterval(gameInterval);
    }, [direction, food, gameOver, isPaused, score, speed]);
    
    // Отрисовка игры
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Очищаем холст
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем сетку (опционально)
        ctx.strokeStyle = '#e0e0e0';
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
            ctx.stroke();
        }
        
        // Рисуем змейку
        snake.forEach((segment, index) => {
            // Голова змейки
            if (index === 0) {
                ctx.fillStyle = '#4CAF50';
            } else {
                // Тело змейки с градиентом
                const greenValue = Math.max(50, 200 - index * 10);
                ctx.fillStyle = `rgb(76, ${greenValue}, 80)`;
            }
            
            ctx.fillRect(
                segment.x * CELL_SIZE,
                segment.y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
            );
            
            // Добавляем глаза для головы
            if (index === 0) {
                ctx.fillStyle = 'white';
                
                // Позиция глаз зависит от направления
                let eyeX1, eyeY1, eyeX2, eyeY2;
                const eyeSize = CELL_SIZE / 5;
                const eyeOffset = CELL_SIZE / 4;
                
                switch (direction) {
                    case 'UP':
                        eyeX1 = segment.x * CELL_SIZE + eyeOffset;
                        eyeY1 = segment.y * CELL_SIZE + eyeOffset;
                        eyeX2 = segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                        eyeY2 = segment.y * CELL_SIZE + eyeOffset;
                        break;
                    case 'DOWN':
                        eyeX1 = segment.x * CELL_SIZE + eyeOffset;
                        eyeY1 = segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                        eyeX2 = segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                        eyeY2 = segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                        break;
                    case 'LEFT':
                        eyeX1 = segment.x * CELL_SIZE + eyeOffset;
                        eyeY1 = segment.y * CELL_SIZE + eyeOffset;
                        eyeX2 = segment.x * CELL_SIZE + eyeOffset;
                        eyeY2 = segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                        break;
                    case 'RIGHT':
                        eyeX1 = segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                        eyeY1 = segment.y * CELL_SIZE + eyeOffset;
                        eyeX2 = segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                        eyeY2 = segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                        break;
                    default:
                        break;
                }
                
                ctx.fillRect(eyeX1, eyeY1, eyeSize, eyeSize);
                ctx.fillRect(eyeX2, eyeY2, eyeSize, eyeSize);
            }
        });
        
        // Рисуем еду
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(
            food.x * CELL_SIZE + CELL_SIZE / 2,
            food.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Добавляем блик на еду
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(
            food.x * CELL_SIZE + CELL_SIZE / 3,
            food.y * CELL_SIZE + CELL_SIZE / 3,
            CELL_SIZE / 6,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Отображаем сообщение о конце игры
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
            ctx.font = '14px Arial';
            ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 40);
        }
        
        // Отображаем сообщение о паузе
        if (isPaused && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2);
        }
    }, [snake, food, direction, gameOver, isPaused, score]);
    
    // Сброс игры
    const resetGame = () => {
        const initialSnake = [{ x: 10, y: 10 }];
        setSnake(initialSnake);
        setDirection('RIGHT');
        setGameOver(false);
        setScore(0);
        setIsPaused(true); // После сброса игра на паузе
        setSpeed(INITIAL_SPEED);
        
        // Генерируем новую еду после установки начального положения змейки
        setTimeout(() => {
            setFood(generateFood());
        }, 0);
    };
    
    return (
        <div className="snake-game">
            <div className="game-info">
                <div className="score">Score: {score}</div>
                <div className="controls">
                    <button 
                        onClick={() => {
                            if (gameOver) {
                                resetGame();
                            } else {
                                setIsPaused(prev => !prev);
                            }
                        }} 
                        className="control-button"
                    >
                        {gameOver ? 'Restart' : (isPaused ? 'Start' : 'Pause')}
                    </button>
                    <button onClick={resetGame} className="control-button">
                        Reset
                    </button>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={GRID_SIZE * CELL_SIZE}
                height={GRID_SIZE * CELL_SIZE}
                className="game-canvas"
            />
            <div className="game-instructions">
                <p>Use arrow keys or WASD to control the snake. Press SPACE to {gameOver ? 'restart' : (isPaused ? 'start' : 'pause')}.</p>
            </div>
        </div>
    );
}

export default SnakeGame;