# Test Agent Model 2

A web application built with Django and React.

## Setup and Installation

### Prerequisites

* Docker
* Docker Compose
* Git

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd test-agent-model-2
   ```

2. **Build and start the services:**
   ```bash
   docker-compose up --build
   ```

   This command will build the Docker images for the frontend and backend, and then start all the services defined in `docker-compose.yml`, including the PostgreSQL database.

   The frontend will be available at `http://localhost:5173`.
   The backend API will be available at `http://localhost:8000`.

### Environment Variables

Create a `.env` file in the root of the project and populate it with the following variables:

```
# Backend
SECRET_KEY=your_secret_key_here
DEBUG=True
DATABASE_URL=postgres://user:password@db:5432/dbname

# Frontend
VITE_API_URL=http://localhost:8000
```

**Note:** The `docker-compose.yml` file uses default values for the database. If you need to customize them, update the `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` environment variables in the `db` service definition within `docker-compose.yml` and ensure they match your `.env` file.

## Running Locally

Once the services are running, you can access the frontend in your browser and interact with the backend API.

## CI/CD

This project uses GitHub Actions for CI/CD. The workflow is defined in `.github/workflows/ci.yml`.
