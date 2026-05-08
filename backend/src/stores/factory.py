import os
from typing import Optional

from .base import StoreBase
from .postgresql import PostgreStore
from .memory import MemoryStore

_store_instance: Optional[StoreBase] = None


async def init_store(force_memory: bool = False) -> StoreBase:
    global _store_instance

    use_memory = (
        force_memory or os.getenv("USE_MEMORY_STORE", "false").lower() == "true"
    )

    if use_memory:
        _store_instance = MemoryStore()
    else:
        _store_instance = PostgreStore()

    await _store_instance.init()
    return _store_instance


async def get_store() -> StoreBase:
    global _store_instance
    if _store_instance is None:
        await init_store()
    return _store_instance


def get_store_instance() -> Optional[StoreBase]:
    return _store_instance


async def close_store() -> None:
    global _store_instance
    if _store_instance is not None:
        await _store_instance.close()
        _store_instance = None
