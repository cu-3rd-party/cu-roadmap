import gspread
from google.oauth2.service_account import Credentials
import os
from typing import List, Dict, Any


class GoogleSheetsService:
    def __init__(self):
        self.spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
        self.credentials_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
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
            self.credentials_file,
            scopes=scopes
        )
        return gspread.authorize(credentials)

    def get_sheet_names(self) -> List[str]:
        raw_sheet_names = os.getenv("GOOGLE_SHEETS_SYNC_SHEETS", "")
        if raw_sheet_names.strip():
            sheet_names = [name.strip() for name in raw_sheet_names.split(",") if name.strip()]
            if sheet_names:
                return sheet_names

        return ["Бизнес и аналитика", "Искусственный интеллект", "Разработка"]

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
