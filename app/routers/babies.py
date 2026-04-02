from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import Baby
from app.schemas.baby import BabyCreate, BabyUpdate, BabyResponse

router = APIRouter(prefix="/babies", tags=["Babies"])


def _get_baby_or_404(baby_id: int, user_id: int, db: Session) -> Baby:
    baby = db.query(Baby).filter(Baby.id == baby_id, Baby.user_id == user_id).first()
    if not baby:
        raise HTTPException(status_code=404, detail="아이 정보를 찾을 수 없습니다.")
    return baby


@router.post("", response_model=BabyResponse, status_code=201)
def create_baby(
    body: BabyCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """아이 등록"""
    baby = Baby(user_id=user_id, **body.model_dump())
    db.add(baby)
    db.commit()
    db.refresh(baby)
    return baby


@router.get("", response_model=List[BabyResponse])
def list_babies(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """내 아이 목록 조회"""
    return db.query(Baby).filter(Baby.user_id == user_id).all()


@router.get("/{baby_id}", response_model=BabyResponse)
def get_baby(
    baby_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """아이 상세 조회"""
    return _get_baby_or_404(baby_id, user_id, db)


@router.patch("/{baby_id}", response_model=BabyResponse)
def update_baby(
    baby_id: int,
    body: BabyUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """아이 정보 수정"""
    baby = _get_baby_or_404(baby_id, user_id, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(baby, field, value)
    db.commit()
    db.refresh(baby)
    return baby


@router.delete("/{baby_id}", status_code=204)
def delete_baby(
    baby_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """아이 삭제 (연결된 기록 모두 삭제)"""
    baby = _get_baby_or_404(baby_id, user_id, db)
    db.delete(baby)
    db.commit()
