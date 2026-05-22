import gspread
import os
from typing import List, Dict, Any
from google.oauth2.service_account import Credentials

from src.settings import get_settings


class GoogleSheetsService:
    def __init__(self):
        settings = get_settings()
        self.spreadsheet_id = settings.google_sheets_spreadsheet_id
        self.credentials_file = settings.google_service_account_file
        self.client = self._authenticate()

    def _authenticate(self):
        if not self.credentials_file or not os.path.exists(self.credentials_file):
            raise FileNotFoundError(
                f"Google Service Account file not found at {self.credentials_file}. "
                "Please place your JSON credentials file there."
            )

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets.readonly",
            "https://www.googleapis.com/auth/drive.metadata.readonly",
        ]
        credentials = Credentials.from_service_account_file(
            self.credentials_file, scopes=scopes
        )
        return gspread.authorize(credentials)

    def get_sheet_names(self) -> List[str]:
        sheets = os.getenv("GOOGLE_SHEETS_SYNC_SHEETS")
        if sheets is not None:
            return [name.strip() for name in sheets.split(",") if name.strip()]

        return get_settings().google_sheets_sync_sheet_names

    def get_sheet_data(self, sheet_name: str) -> List[Dict[str, Any]]:
        """Fetches all records from a specific sheet by name."""
        spreadsheet = self.client.open_by_key(self.spreadsheet_id)
        worksheet = spreadsheet.worksheet(sheet_name)
        return worksheet.get_all_records()

    def get_all_relevant_sheets(self) -> Dict[str, List[Dict[str, Any]]]:
        """Fetches data from all configured sheets."""
        sheets_to_sync = self.get_sheet_names()
        all_data = {}
        for name in sheets_to_sync:
            all_data[name] = self.get_sheet_data(name)
        return all_data
