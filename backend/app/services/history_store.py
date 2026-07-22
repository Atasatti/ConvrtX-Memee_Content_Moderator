"""Durable scan-history storage backed by SQLite."""

from collections.abc import Iterable, Mapping
from pathlib import Path
import sqlite3
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
HISTORY_DIRECTORY = PROJECT_ROOT / "database" / "history"
DATABASE_PATH = HISTORY_DIRECTORY / "aegis-history.sqlite3"


def _connect() -> sqlite3.Connection:
    HISTORY_DIRECTORY.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 10000")
    return connection


def initialize_history_store() -> None:
    """Create the on-disk database and schema when the API starts."""

    with _connect() as connection:
        connection.execute("PRAGMA journal_mode = WAL")
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS scan_history (
                id TEXT PRIMARY KEY,
                kind TEXT NOT NULL,
                subject TEXT NOT NULL,
                created_at TEXT NOT NULL,
                flagged INTEGER NOT NULL CHECK (flagged IN (0, 1)),
                risk TEXT NOT NULL,
                summary TEXT NOT NULL,
                duration_ms REAL NOT NULL CHECK (duration_ms >= 0)
            );

            CREATE INDEX IF NOT EXISTS idx_scan_history_created_at
                ON scan_history (created_at DESC);
            """
        )


def _row_to_record(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "kind": row["kind"],
        "subject": row["subject"],
        "createdAt": row["created_at"],
        "flagged": bool(row["flagged"]),
        "risk": row["risk"],
        "summary": row["summary"],
        "durationMs": row["duration_ms"],
    }


def list_history() -> list[dict[str, Any]]:
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT id, kind, subject, created_at, flagged, risk, summary, duration_ms
            FROM scan_history
            ORDER BY created_at DESC
            """
        ).fetchall()
    return [_row_to_record(row) for row in rows]


def _record_values(record: Mapping[str, Any]) -> tuple[Any, ...]:
    return (
        record["id"],
        record["kind"],
        record["subject"],
        record["createdAt"],
        int(record["flagged"]),
        record["risk"],
        record["summary"],
        record["durationMs"],
    )


UPSERT_SQL = """
    INSERT INTO scan_history (
        id, kind, subject, created_at, flagged, risk, summary, duration_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        kind = excluded.kind,
        subject = excluded.subject,
        created_at = excluded.created_at,
        flagged = excluded.flagged,
        risk = excluded.risk,
        summary = excluded.summary,
        duration_ms = excluded.duration_ms
"""


def save_history_record(record: Mapping[str, Any]) -> None:
    with _connect() as connection:
        connection.execute(UPSERT_SQL, _record_values(record))


def import_history_records(records: Iterable[Mapping[str, Any]]) -> int:
    values = [_record_values(record) for record in records]
    if not values:
        return 0

    with _connect() as connection:
        connection.executemany(UPSERT_SQL, values)
    return len(values)


def delete_history_record(record_id: str) -> None:
    with _connect() as connection:
        connection.execute("DELETE FROM scan_history WHERE id = ?", (record_id,))


def clear_history() -> None:
    with _connect() as connection:
        connection.execute("DELETE FROM scan_history")


initialize_history_store()
