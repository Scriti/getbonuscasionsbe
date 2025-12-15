import { Controller, Get } from '@nestjs/common';
import { FirestoreService } from '../firestore/firestore.service';
import { BonusDto } from './dto/bonus.dto';

@Controller('bonuses')
export class BonusesController {
  constructor(private readonly firestoreService: FirestoreService) {}

  @Get()
  async getBonuses(): Promise<BonusDto[]> {
    return this.firestoreService.getBonuses();
  }

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}






