# Shed Tournament

A web application for managing ELO-based competitions. This application allows you to track player rankings, record match outcomes, and maintain an audit log of all activities.
The app stores its data in a postgres database which is provisioned on startup and persisted as a docker volume.
This app can be self-hosted with minimal modification.

## Features

- Player management (add/remove players)
- ELO rating system for fair competition ranking
- Match recording with automatic ELO updates
- Audit log for tracking all system activities
- Modern, responsive UI built with Material-UI
- RESTful API backend

## Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- pip (Python package manager)
- npm (Node package manager)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ShedTournament.git
cd ShedTournament
```

2. Set up the backend:
```bash
cd backend
pip install flask flask-sqlalchemy flask-migrate flask-cors python-dotenv
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

## Usage with Docker

1. Build and start the containers:
```bash
docker compose build
docker compose up -d
```

2. The application will be available at `http://localhost:81`

### Going Live

If you want to make this app externally accessible in production you will need to update the docker-compose.yml file:
- Update `BACKEND_API_URL` environment parameter for the frontend app
- Add the network your reverse proxy container (such as nginx)

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting a PR

## Reporting Issues

Found a bug or have a feature request? Please use GitHub Issues:

1. Check if the issue has already been reported
2. Use the issue template when creating a new issue
3. Provide detailed steps to reproduce the problem
4. Include any relevant error messages or screenshots

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and Flask
- Uses Material-UI for the frontend components
- Implements the ELO rating system for fair competition 