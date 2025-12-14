import { Controller, Get } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { BonusDto } from './dto/bonus.dto';

@Controller('bonuses')
export class BonusesController {
  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

  @Get()
  async getBonuses(): Promise<BonusDto[]> {
    return this.googleSheetsService.getBonuses();
  }

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}






