from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, Iterable, Optional, Tuple, Union

import requests
from requests.auth import AuthBase
from requests.exceptions import RequestException
from dotenv import load_dotenv

load_dotenv()

COUCHDB_URL = os.getenv("COUCHDB_URL", "http://127.0.0.1:5984")
USERNAME = os.getenv("USERNAME")
PASSWORD = os.getenv("PASSWORD")
AUTH: Optional[Union[Tuple[str, str], AuthBase]] = (
    (USERNAME, PASSWORD) if USERNAME and PASSWORD else None
)

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATABASES: Dict[str, Optional[Path]] = {
    "recipes": None,
    "users": None,
}


def ensure_databases(database_map: Optional[Dict[str, Optional[Union[str, Path]]]] = None) -> None:
    """Ensure every database exists and seed the ones with a data file."""
    if not COUCHDB_URL:
        raise RuntimeError("COUCHDB_URL environment variable must be set before setup runs")

    databases = database_map or DEFAULT_DATABASES

    for db_name, seed_file in databases.items():
        created = ensure_database(db_name)
        if seed_file:
            seed_database(db_name, Path(seed_file))
        status = "created" if created else "present"
        print(f"[setup-db] {db_name} database is {status}.")


def ensure_database(db_name: str) -> bool:
    """Create the database if it does not exist."""
    url = f"{COUCHDB_URL}/{db_name}"
    response = requests.head(url, auth=AUTH, timeout=10)

    if response.status_code == 200:
        return False
    if response.status_code == 404:
        create_response = requests.put(url, auth=AUTH, timeout=10)
        create_response.raise_for_status()
        return True

    response.raise_for_status()
    return False


def seed_database(db_name: str, seed_path: Path) -> None:
    """Seed the database with documents from a JSON file when available."""
    if not seed_path.exists():
        print(f"[setup-db] Seed file {seed_path} not found, skipping seeding for {db_name}.")
        return

    try:
        documents = load_documents(seed_path)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Failed to parse seed file {seed_path}") from exc

    for doc in documents:
        upsert_document(db_name, doc)


def load_documents(seed_path: Path) -> Iterable[dict]:
    """Load documents from a JSON file (single object or list)."""
    with seed_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if isinstance(payload, list):
        return payload
    return [payload]


def upsert_document(db_name: str, document: dict) -> None:
    """Create the document when it is not already present."""
    doc = dict(document)
    doc.pop("_rev", None)
    doc_id = doc.get("_id")

    if doc_id:
        url = f"{COUCHDB_URL}/{db_name}/{doc_id}"
        response = requests.get(url, auth=AUTH, timeout=10)
        if response.status_code == 200:
            return
        if response.status_code not in (404, 410):
            response.raise_for_status()
        create_response = requests.put(url, json=doc, auth=AUTH, timeout=10)
        create_response.raise_for_status()
        return

    post_url = f"{COUCHDB_URL}/{db_name}"
    post_response = requests.post(post_url, json=doc, auth=AUTH, timeout=10)
    post_response.raise_for_status()


if __name__ == "__main__":
    try:
        ensure_databases()
    except RequestException as exc:
        raise SystemExit(f"CouchDB setup failed: {exc}")