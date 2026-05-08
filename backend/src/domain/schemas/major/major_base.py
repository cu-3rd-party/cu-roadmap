from pydantic import BaseModel


class MajorBase(BaseModel):
    title: str
    school: str
