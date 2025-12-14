import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as fs from 'fs';
import { BonusDto } from '../bonuses/dto/bonus.dto';

@Injectable()
export class GoogleSheetsService implements OnModuleInit {
  private sheets: any;
  private spreadsheetId: string;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.spreadsheetId = this.configService.get<string>('GOOGLE_SHEET_ID') || '';
  }

  async onModuleInit() {
    // Don't initialize on module init - do it lazily when getBonuses is called
    // This prevents memory issues and allows the app to start even without credentials
    console.log('Google Sheets service loaded (will initialize on first request)');
  }

  /**
   * Converts Google Drive links to viewable image format
   * Supports various Google Drive URL formats and extracts the file ID
   */
  private convertDriveLinkToViewable(link: string): string {
    if (!link || link.trim() === '') {
      return '';
    }

    // If already in the correct format, return as is
    if (link.includes('drive.usercontent.google.com/download')) {
      return link;
    }

    let fileId = '';

    // Extract file ID from various Google Drive URL formats
    // Format 1: https://drive.google.com/file/d/FILE_ID/view
    const fileIdMatch1 = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch1) {
      fileId = fileIdMatch1[1];
    } else {
      // Format 2: https://drive.google.com/open?id=FILE_ID
      const fileIdMatch2 = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch2) {
        fileId = fileIdMatch2[1];
      } else {
        // Format 3: Just the file ID itself (if it's already just an ID)
        const idPattern = /^[a-zA-Z0-9_-]+$/;
        if (idPattern.test(link.trim())) {
          fileId = link.trim();
        }
      }
    }

    // If we couldn't extract a file ID, return the original link
    if (!fileId) {
      return link;
    }

    // Convert to viewable format
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
  }

  private async initializeSheets(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.isInitialized) {
      return;
    }

    // Option 1: Use JSON credentials file (preferred - simpler and avoids key parsing issues)
    const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    
    if (credentialsPath && fs.existsSync(credentialsPath)) {
      try {
        // Use GoogleAuth with credentials file - handles all key format issues automatically
        const auth = new google.auth.GoogleAuth({
          keyFile: credentialsPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        this.isInitialized = true;
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error initializing with credentials file:', errorMessage);
        throw new Error(`Failed to initialize Google Sheets with credentials file: ${errorMessage}`);
      }
    }

    // Option 2: Use JSON credentials from environment variable (for Railway, Heroku, etc.)
    const credentialsJson = this.configService.get<string>('GOOGLE_CREDENTIALS_JSON');
    if (credentialsJson) {
      try {
        const credentials = JSON.parse(credentialsJson);
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        this.isInitialized = true;
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error initializing with credentials JSON:', errorMessage);
        throw new Error(`Failed to initialize Google Sheets with credentials JSON: ${errorMessage}`);
      }
    }

    // Option 3: Fallback to individual environment variables (if JSON not provided)
    const privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY');
    const clientEmail = this.configService.get<string>('GOOGLE_CLIENT_EMAIL');

    if (!privateKey || !clientEmail) {
      throw new Error(
        'Either GOOGLE_APPLICATION_CREDENTIALS (path to JSON file), GOOGLE_CREDENTIALS_JSON (JSON string), or both GOOGLE_PRIVATE_KEY and GOOGLE_CLIENT_EMAIL must be set'
      );
    }

    try {
      // Handle private key formatting
      let formattedKey = privateKey.trim().replace(/^["']|["']$/g, '');
      formattedKey = formattedKey.replace(/\\n/g, '\n').trim();

      const jwtClient = new google.auth.JWT({
        email: clientEmail,
        key: formattedKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: jwtClient });
      this.isInitialized = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error initializing Google Sheets auth:', errorMessage);
      throw new Error(`Failed to initialize Google Sheets authentication: ${errorMessage}`);
    }
  }

  async getBonuses(): Promise<BonusDto[]> {
    // Lazy initialization - only initialize when actually needed
    if (!this.isInitialized) {
      try {
        await this.initializeSheets();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Failed to initialize Google Sheets:', errorMessage);
        throw new Error('Google Sheets service is not configured. Please set GOOGLE_SHEET_ID and authentication credentials.');
      }
    }

    if (!this.sheets || !this.spreadsheetId) {
      throw new Error('Google Sheets service is not properly initialized');
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Entries!A2:H', // Skip header row, read from row 2 onwards (including Tags column H)
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      const bonuses: BonusDto[] = rows
        .filter((row) => row && row[0]) // Filter out empty rows
        .map((row) => {
          // Parse tags from column H (index 7)
          // Tags in Google Sheets dropdown with multiple selections are typically comma-separated
          const tagsString = row[7] || '';
          const tags = tagsString
            ? tagsString
                .split(',')
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag.length > 0)
            : [];

          return {
            brandName: row[0] || '',
            logo: this.convertDriveLinkToViewable(row[1] || ''),
            welcomeBonus: row[2] || '',
            bonusDetails: row[3] || '',
            wager: row[4] || '',
            minDeposit: row[5] || '',
            trackingLink: row[6] || '',
            tags,
          };
        });

      return bonuses;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error reading from Google Sheets:', errorMessage);
      throw new Error(`Failed to read bonuses from Google Sheets: ${errorMessage}`);
    }
  }
}

