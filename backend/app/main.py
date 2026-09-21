from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, Depends
from app.auth import current_user
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import agent_task, agents, demo_services, health, payments, policies, services, transactions
from app.config import settings
from app.database.database import init_db

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("agentpay")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AgentPay backend database & services...")
    await init_db()
    logger.info("AgentPay backend initialized successfully.")
    yield
    logger.info("Shutting down AgentPay backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous Payment Infrastructure & Policy Guardrails for AI Agents",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router)
app.include_router(services.router, dependencies=[Depends(current_user)])
app.include_router(agents.router, dependencies=[Depends(current_user)])
app.include_router(policies.router, dependencies=[Depends(current_user)])
app.include_router(payments.router, dependencies=[Depends(current_user)])
app.include_router(transactions.router, dependencies=[Depends(current_user)])
app.include_router(agent_task.router, dependencies=[Depends(current_user)])
app.include_router(demo_services.router, prefix="/api")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "An internal server error occurred"},
    )


@app.get("/")
async def root():
    return {
        "project": "AgentPay",
        "tagline": "Autonomous Payment Infrastructure for AI Agents",
        "docs": "/docs",
        "health": "/health",
        "version": settings.VERSION,
    }
