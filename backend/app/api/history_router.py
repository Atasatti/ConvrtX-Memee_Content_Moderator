"""CRUD endpoints for the persistent Aegis scan history."""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Response, status
from pydantic import BaseModel, Field, field_validator

from ..services.history_store import (
    clear_history,
    delete_history_record,
    import_history_records,
    list_history,
    save_history_record,
)


ScanKind = Literal["text", "number", "image", "image-text", "audio", "video"]
RiskLevel = Literal["safe", "low", "elevated", "high", "critical"]


class HistoryRecord(BaseModel):
    id: str = Field(min_length=1, max_length=128)
    kind: ScanKind
    subject: str = Field(min_length=1, max_length=20_000)
    createdAt: str = Field(min_length=1, max_length=64)
    flagged: bool
    risk: RiskLevel
    summary: str = Field(max_length=20_000)
    durationMs: float = Field(ge=0)

    @field_validator("createdAt")
    @classmethod
    def validate_created_at(cls, value: str) -> str:
        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as error:
            raise ValueError("createdAt must be an ISO-8601 timestamp") from error
        return value


class HistoryImport(BaseModel):
    records: list[HistoryRecord]


class HistoryImportResult(BaseModel):
    imported: int


history_router = APIRouter(prefix="/history", tags=["History"])


def _payload(record: HistoryRecord) -> dict:
    return record.model_dump()


@history_router.get("", response_model=list[HistoryRecord])
def get_history():
    return list_history()


@history_router.post("", response_model=HistoryRecord, status_code=status.HTTP_201_CREATED)
def create_history_record(record: HistoryRecord):
    payload = _payload(record)
    save_history_record(payload)
    return payload


@history_router.post("/import", response_model=HistoryImportResult)
def import_history(history: HistoryImport):
    imported = import_history_records(_payload(record) for record in history.records)
    return {"imported": imported}


@history_router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history(record_id: str):
    delete_history_record(record_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@history_router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_history():
    clear_history()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
