from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.edu import Edu
from app.schemas.edu import ModuleCreate, ModuleOut, ModuleUpdate

router = APIRouter(prefix="/edu", tags=["edu"])


@router.post("", response_model=ModuleOut)
def create_edumodule(
    module: ModuleCreate,
    db: Session = Depends(get_db),
):
    new_module = Edu(
        name=module.name,
        url=module.url,
        description=module.description,
    )

    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    return new_module


@router.put("/{module_id}", response_model=ModuleOut)
def update_edumodule(
    module_id: str,
    module_update: ModuleUpdate,
    db: Session = Depends(get_db),
):
    module = db.query(Edu).filter(Edu.id == module_id).first()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if module_update.name is not None:
        module.name = module_update.name
    if module_update.url is not None:
        module.url = module_update.url
    if module_update.description is not None:
        module.description = module_update.description

    db.commit()
    db.refresh(module)
    return module


@router.delete("/{module_id}")
def delete_edumodule(
    module_id: str,
    db: Session = Depends(get_db),
):
    module = db.query(Edu).filter(Edu.id == module_id).first()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    db.delete(module)
    db.commit()

    return {"message": "Module deleted successfully"}