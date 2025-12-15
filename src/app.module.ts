import { FirestoreService } from './firestore/firestore.service';
import { BonusesController } from './bonuses/bonuses.controller';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [BonusesController],
  providers: [FirestoreService],
})
export class AppModule {}
