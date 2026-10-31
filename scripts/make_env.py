"""Print a .env with freshly generated secrets for local development."""
import secrets

from_key = None
try:
    from cryptography.fernet import Fernet
    from_key = Fernet.generate_key().decode()
except ImportError:
    import base64
    from_key = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()

pg, app = secrets.token_urlsafe(24), secrets.token_urlsafe(24)
s3 = secrets.token_urlsafe(24)
print(f"""ENV=development
POSTGRES_PASSWORD={pg}
APP_DB_PASSWORD={app}
SECRET_KEY={secrets.token_urlsafe(48)}
CREDENTIALS_ENCRYPTION_KEY={from_key}
S3_ACCESS_KEY=vciso-evidence
S3_SECRET_KEY={s3}
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-opus-5-5
PUBLIC_APP_URL=http://localhost:3000
COOKIE_SECURE=false
DEMO_PASSWORD={secrets.token_urlsafe(12)}
# Local (non-Docker) API/test runs connect through the published host ports:
DATABASE_URL=postgresql+psycopg://vciso_app:{app}@localhost:55432/vciso
MIGRATION_DATABASE_URL=postgresql+psycopg://vciso:{pg}@localhost:55432/vciso
REDIS_URL=redis://localhost:56379/0
S3_ENDPOINT_URL=http://localhost:8333""")
