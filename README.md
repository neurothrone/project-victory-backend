# Project Victory Backend

## Setup

1. Create a `.env` file in the root directory with the following content:
    ```env
    # Database connection
    MONGO_URI=...

    # CORS setup
    # For local development
    DEV_CLIENT_BASE_URL=...

    # For production
    PROD_CLIENT_BASE_URL=...
    ```
2. Modify the `DEV_CLIENT_BASE_URL` and `PROD_CLIENT_BASE_URL` to match the URL of the client.