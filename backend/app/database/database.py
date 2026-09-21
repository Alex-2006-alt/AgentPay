from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy import event

from app.config import settings

# Determine database connect arguments (e.g. for SQLite)
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False, "timeout": 30}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args,
)

if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine.sync_engine, "connect")
    def enable_foreign_keys(connection, _):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables and seed defaults if empty."""
    from app.database.models import User, Agent, Wallet, Policy, Provider, Service
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if not settings.SEED_DEMO_DATA or settings.PAYMENT_MODE == "live":
        return
        
    # Seed initial demo data
    async with AsyncSessionLocal() as session:
        try:
            from sqlalchemy import select
            
            # Check if demo provider exists
            res = await session.execute(select(Provider).limit(1))
            if not res.scalars().first():
                # 1. Create Default Provider
                provider = Provider(
                    id="provider_official",
                    name="AgentPay Official Services",
                    website="https://agentpay.network",
                    is_verified=True,
                    reputation=4.95,
                )
                
                provider2 = Provider(
                    id="provider_deeplingo",
                    name="DeepLingo AI",
                    website="https://deeplingo.ai",
                    is_verified=True,
                    reputation=4.7,
                )
                
                provider3 = Provider(
                    id="provider_fastapi",
                    name="FastAPI Microservices",
                    website="https://fastapi.services",
                    is_verified=False,
                    reputation=3.9,
                )
                
                session.add_all([provider, provider2, provider3])
                await session.flush()

                # 2. Create Default Services
                services = [
                    # Category: Information
                    Service(
                        id="srv_weather_01",
                        provider_id=provider.id,
                        name="Weather Matrix API",
                        description="Real-time global meteorological forecasts & temperature metrics",
                        category="Information",
                        endpoint="/api/demo/weather",
                        price=0.001,
                        currency="USDC",
                        wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                        rating=4.8,
                        success_rate=99.8,
                        average_response_time=45.0,
                        status="active",
                    ),
                    Service(
                        id="srv_weather_02",
                        provider_id=provider3.id,
                        name="FastWeather Info",
                        description="Basic weather lookups for cheap",
                        category="Information",
                        endpoint="/api/demo/weather_basic",
                        price=0.0005,
                        currency="USDC",
                        wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                        rating=3.5,
                        success_rate=92.0,
                        average_response_time=120.0,
                        status="active",
                    ),
                    # Category: Language
                    Service(
                        id="srv_translate_01",
                        provider_id=provider.id,
                        name="Neural Polyglot Translation",
                        description="Ultra-fast multilingual semantic translation across 100+ languages",
                        category="Language",
                        endpoint="/api/demo/translate",
                        price=0.005,
                        currency="USDC",
                        wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                        rating=4.9,
                        success_rate=99.5,
                        average_response_time=120.0,
                        status="active",
                    ),
                    Service(
                        id="srv_translate_02",
                        provider_id=provider2.id,
                        name="DeepLingo Advanced Translate",
                        description="High accuracy domain-specific translation",
                        category="Language",
                        endpoint="/api/demo/translate_advanced",
                        price=0.008,
                        currency="USDC",
                        wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                        rating=5.0,
                        success_rate=99.9,
                        average_response_time=80.0,
                        status="active",
                    ),
                    Service(
                        id="srv_translate_03",
                        provider_id=provider3.id,
                        name="Budget Translate",
                        description="Basic word-for-word translation",
                        category="Language",
                        endpoint="/api/demo/translate_basic",
                        price=0.002,
                        currency="USDC",
                        wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                        rating=3.8,
                        success_rate=95.0,
                        average_response_time=300.0,
                        status="active",
                    ),
                    # Category: Analysis
                    Service(
                        id="srv_summarize_01",
                        provider_id=provider.id,
                        name="DeepSynth Summarization",
                        description="High-density abstractive summarization and key insights extractor",
                        category="Analysis",
                        endpoint="/api/demo/summarize",
                        price=0.010,
                        currency="USDC",
                        wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                        rating=4.9,
                        success_rate=99.2,
                        average_response_time=210.0,
                        status="active",
                    ),
                    Service(
                        id="srv_summarize_02",
                        provider_id=provider2.id,
                        name="DeepLingo Summarizer",
                        description="Fast extractive summarization",
                        category="Analysis",
                        endpoint="/api/demo/summarize_ext",
                        price=0.006,
                        currency="USDC",
                        wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                        rating=4.5,
                        success_rate=98.0,
                        average_response_time=180.0,
                        status="active",
                    ),
                    # Category: Vision
                    Service(
                        id="srv_ocr_01",
                        provider_id=provider.id,
                        name="VisionText OCR Extraction",
                        description="High-accuracy optical character recognition for documents and receipts",
                        category="Vision",
                        endpoint="/api/demo/ocr",
                        price=0.002,
                        currency="USDC",
                        wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                        rating=4.7,
                        success_rate=98.5,
                        average_response_time=350.0,
                        status="active",
                    ),
                    # Category: Search
                    Service(
                        id="srv_search_01",
                        provider_id=provider.id,
                        name="Quantum Web Search",
                        description="Real-time internet indexing and semantic search",
                        category="Search",
                        endpoint="/api/demo/search",
                        price=0.003,
                        currency="USDC",
                        wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                        rating=4.9,
                        success_rate=99.9,
                        average_response_time=80.0,
                        status="active",
                    ),
                    # Category: Creative
                    Service(
                        id="srv_image_01",
                        provider_id=provider.id,
                        name="Diffusion Art Generation",
                        description="AI-powered high-resolution image synthesis",
                        category="Creative",
                        endpoint="/api/demo/generate_image",
                        price=0.050,
                        currency="USDC",
                        wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                        rating=4.8,
                        success_rate=97.0,
                        average_response_time=1500.0,
                        status="active",
                    ),
                ]
                session.add_all(services)

                # 3. Create Default User & Agent
                user = User(
                    id="user_default",
                    wallet_address="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                )
                session.add(user)
                await session.flush()

                agent = Agent(
                    id="agent_primary",
                    user_id=user.id,
                    name="AgentPay Primary Autonome",
                    status="active",
                    wallet_address="0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
                )
                session.add(agent)
                await session.flush()

                # 4. Create Agent Wallet
                wallet = Wallet(
                    id="wallet_agent_primary",
                    agent_id=agent.id,
                    address=agent.wallet_address,
                    network="Hardhat Local",
                    chain_id=1337,
                    balance=10.00,  # 10.00 Mock USDC testnet balance
                    currency="USDC",
                )
                session.add(wallet)

                # 5. Create Default Spending Policy
                policy = Policy(
                    id="policy_agent_primary",
                    agent_id=agent.id,
                    max_transaction=settings.DEFAULT_MAX_TRANSACTION,
                    daily_limit=settings.DEFAULT_DAILY_LIMIT,
                    monthly_limit=settings.DEFAULT_MONTHLY_LIMIT,
                    auto_payment=settings.AUTO_PAYMENT_ENABLED,
                    approved_services="srv_weather_01,srv_weather_02,srv_translate_01,srv_translate_02,srv_translate_03,srv_summarize_01,srv_summarize_02,srv_ocr_01,srv_search_01,srv_image_01",
                )
                session.add(policy)
                await session.commit()
                
        except Exception:
            await session.rollback()
            raise
