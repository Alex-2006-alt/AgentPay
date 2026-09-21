import secrets
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.config import settings
from app.database.models import Agent

bearer = HTTPBearer(auto_error=False)


async def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if credentials:
        for token, user_id in settings.API_KEYS.items():
            if token and secrets.compare_digest(credentials.credentials, token):
                return user_id
    raise HTTPException(401, "Valid API bearer token required", headers={"WWW-Authenticate": "Bearer"})


async def administrator(user_id: str = Depends(current_user)) -> str:
    if user_id not in settings.ADMIN_USER_IDS:
        raise HTTPException(403, "Administrator access required")
    return user_id


async def owned_agent(db, agent_id: str, user_id: str) -> Agent:
    agent = await db.get(Agent, agent_id)
    if not agent or agent.user_id != user_id:
        raise HTTPException(404, "Agent not found")
    return agent
