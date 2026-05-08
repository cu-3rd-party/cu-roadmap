from typing import List

from pydantic import BaseModel

from src.domain.schemas.validation.validation_message import ValidationMessage


class ValidationResult(BaseModel):
    is_valid: bool
    messages: List[ValidationMessage]
    total_load: float
