# gmail_auth.py
from app.core.config import Config
from google_auth_oauthlib.flow import Flow

def create_gmail_flow():
    config = Config()  # Load all env variables via Pydantic config

    return Flow.from_client_config(
        {
            "web": {
                "client_id": config.GOOGLE_CLIENT_ID,
                "client_secret": config.GOOGLE_CLIENT_SECRET,
                "auth_uri": str(config.AUTH_URI),
                "token_uri": str(config.TOKEN_URI),
                "redirect_uris": [str(config.GOOGLE_REDIRECT_URI)],
            }
        },
        scopes=[
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "openid"
        ],
        redirect_uri=str(config.GOOGLE_REDIRECT_URI)
    )