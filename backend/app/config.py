from typing import List, Union, Literal
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentPay API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    PAYMENT_MODE: Literal["simulation", "live"] = "simulation"
    API_KEYS: dict[str, str] = {}  # bearer token -> user id; provision out of band
    ADMIN_USER_IDS: List[str] = []
    SERVICE_ORIGINS: List[str] = []  # explicitly trusted HTTPS provider origins
    SEED_DEMO_DATA: bool = True

    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./agentpay.db"

    # AI Provider
    AI_PROVIDER: str = "mock"  # Reserved; the current planner is deterministic.
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.0-flash"

    # Blockchain
    EVM_RPC_URL: str = "http://127.0.0.1:8545"
    CHAIN_ID: int = 1337
    AGENTPAY_CONTRACT_ADDRESS: str = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    MOCK_USDC_CONTRACT_ADDRESS: str = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    PAYMENT_MANAGER_CONTRACT_ADDRESS: str = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    AGENT_RELAYER_PRIVATE_KEY: str = ""

    # Default Policy Controls
    DEFAULT_MAX_TRANSACTION: float = 0.10
    DEFAULT_DAILY_LIMIT: float = 2.00
    DEFAULT_MONTHLY_LIMIT: float = 20.00
    AUTO_PAYMENT_ENABLED: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
