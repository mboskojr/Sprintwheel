from pydantic import BaseModel
from uuid import UUID

class ModuleCreate(BaseModel):
    name: str
    url: str
    description: str

class ModuleUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    description: str | None = None

class ModuleOut(BaseModel):
    name: str
    url: str
    description: str
    id: UUID

    class Config:
        from_attributes = True