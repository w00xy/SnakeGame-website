# Snake Game

A simple web-based Snake game with user authentication. Play the classic game while keeping track of your score and competing with friends!
![{5F3969AA-1B44-4699-B398-46015C824C08}](https://github.com/user-attachments/assets/7f4ea163-9f69-4282-9145-dca823e4b14a)

## Features

- User authentication (login and registration)
- Classic Snake gameplay
- Responsive design for various screen sizes
- Score tracking

## Technologies Used

- Frontend: React, CSS
- Backend: FastAPI
- Database: SQLite
- Docker for containerization
- Nginx for reverse proxying and serving static files

## Installation

### Prerequisites

- Docker
- Docker Compose

### Clone the Repository

```bash
git clone https://github.com/yourusername/snake-game.git
cd snake-game
```

### Setup Environment Variables

Copy the `.env.example` file to `.env` and fill in the required values.

```bash
cp .env.example .env
```

### Build and Run the Application

1. Build the Docker containers:

   ```bash
   make build
   ```

2. Start the application:

   ```bash
   make up
   ```

3. Access the game in your browser at `http://localhost`.

## Usage

- Register a new account or log in with an existing account.
- Use the arrow keys or WASD to control the snake.
- Press SPACE to pause or restart the game.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

Your Name - [w00xy](mailto:w00xyinsp@gmail.com)

Project Link: [https://github.com/w00xy/SnakeGame-website](https://github.com/w00xy/SnakeGame-website)
