# MadHelp

This repository contains a Flask backend and a React frontend for the MadHelp application.

## Backend setup

1. Create a virtual environment and install dependencies:

   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r mh-backend/requirements.txt
   ```

2. Run the development server:

   ```bash
   python mh-backend/app.py
   ```

The API will be available at `http://localhost:5000`.

## Frontend setup

From the `mh-frontend` folder install dependencies and start the dev server:

```bash
npm install
npm run dev
```

The frontend will by default connect to the backend running on port 5000.


## Authentication workflow

The backend exposes `/api/signup` and `/api/login` endpoints. Users register by submitting a form with a username, email, password, a CV PDF and at least one DARS PDF. Passwords are hashed with `bcrypt` before storing them in the SQLite database. On success the API returns a short‑lived access token and a long‑lived refresh token (JSON Web Tokens).

Authenticated requests include the access token in the `Authorization` header (`Bearer <token>`). When the access token expires the frontend calls `/api/token/refresh` with the refresh token to obtain a new pair of tokens. Protected routes in the API use `@jwt_required` to enforce authentication.

