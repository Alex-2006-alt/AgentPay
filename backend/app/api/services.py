from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import Provider, Service
from app.schemas.services import ServiceCreate, ServiceResponse

router = APIRouter(prefix="/services", tags=["Services & Marketplace"])


@router.get("", response_model=List[ServiceResponse])
async def list_services(
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query("active", description="Filter by service status"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all available microservices from the marketplace."""
    query = select(Service)
    if category:
        query = query.where(Service.category == category)
    if status and status != "all":
        query = query.where(Service.status == status)

    result = await db.execute(query.order_by(Service.rating.desc()))
    return result.scalars().all()


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service_details(service_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve metadata and pricing for a specific service."""
    service = await db.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{service_id}' not found in marketplace",
        )
    return service


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def register_service(payload: ServiceCreate, db: AsyncSession = Depends(get_db)):
    """Register a new micro-service provider endpoint."""
    provider = await db.get(Provider, payload.provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provider ID '{payload.provider_id}' does not exist",
        )

    new_service = Service(**payload.model_dump())
    db.add(new_service)
    await db.commit()
    await db.refresh(new_service)
    return new_service
