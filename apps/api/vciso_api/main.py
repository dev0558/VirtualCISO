import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .config import get_settings
from .routers import auth, checks, orgs, policies, public, questionnaires, vciso

logging.basicConfig(level=logging.INFO, format='{"level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}')

settings = get_settings()
app = FastAPI(title="SecuraVantage API", version="1.0.0",
              docs_url="/api/docs" if settings.is_dev else None, openapi_url="/api/openapi.json")

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
DEMO_ALLOWED_WRITES = {"/api/v1/auth/login", "/api/v1/auth/logout", "/api/v1/public/leads"}


@app.middleware("http")
async def csrf_and_headers(request: Request, call_next):
    # Cookie-authenticated mutating requests must carry a custom header that cross-site forms cannot set.
    if request.method not in SAFE_METHODS and request.url.path.startswith("/api/v1/") \
            and not request.url.path.startswith("/api/v1/public/") \
            and request.headers.get("x-requested-with") != "securavantage":
        return JSONResponse({"detail": "Missing CSRF header"}, status_code=403)
    if settings.demo_read_only and request.method not in SAFE_METHODS and request.url.path not in DEMO_ALLOWED_WRITES:
        return JSONResponse({"detail": "This is a read-only demo. Get in touch to try it with your own data."},
                            status_code=403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers.setdefault("Cache-Control", "no-store")
    return response


for r in (auth.router, orgs.router, checks.router, policies.router, questionnaires.router, vciso.router, public.router):
    app.include_router(r, prefix="/api/v1")


@app.get("/healthz")
def healthz():
    return {"ok": True}
