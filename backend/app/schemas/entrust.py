from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class EntrustCreate(BaseModel):
    name: str = Field(..., max_length=200)
    client: str | None = None
    method_std: str | None = None
    assignee_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    remark: str | None = None


class EntrustUpdate(BaseModel):
    name: str | None = Field(None, max_length=200)
    client: str | None = None
    method_std: str | None = None
    status: str | None = None
    assignee_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    remark: str | None = None


class EntrustOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_no: str
    name: str
    client: str | None
    method_std: str | None
    status: str
    assignee_id: int | None
    start_date: date | None
    end_date: date | None
    remark: str | None
    created_at: datetime