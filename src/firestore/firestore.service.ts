import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { BonusDto } from '../bonuses/dto/bonus.dto';

@Injectable()
export class FirestoreService implements OnModuleInit {
  private db: admin.firestore.Firestore;
  private isInitialized = false;
  private readonly collectionName = 'bonuses';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Lazy initialization - only initialize when actually needed
    console.log('Firestore service loaded (will initialize on first request)');
  }

  private async initializeFirestore(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Option 1: Use JSON credentials file
      const credentialsPath = this.configService.get<string>('FIRESTORE_APPLICATION_CREDENTIALS');
      
      if (credentialsPath) {
        // Resolve path relative to project root (works in both src and dist)
        const resolvedPath = path.isAbsolute(credentialsPath)
          ? credentialsPath
          : path.resolve(process.cwd(), credentialsPath);
        
        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`Credentials file not found at: ${resolvedPath}`);
        }
        
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: this.configService.get<string>('FIRESTORE_PROJECT_ID') || serviceAccount.project_id,
        });
        this.db = admin.firestore();
        this.isInitialized = true;
        return;
      }

      // Option 2: Use JSON credentials from environment variable (for Railway, Heroku, etc.)
      const credentialsJson = this.configService.get<string>('FIRESTORE_CREDENTIALS_JSON');
      if (credentialsJson) {
        const serviceAccount = JSON.parse(credentialsJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: this.configService.get<string>('FIRESTORE_PROJECT_ID') || serviceAccount.project_id,
        });
        this.db = admin.firestore();
        this.isInitialized = true;
        return;
      }

      // Option 3: Use default credentials (for local development with gcloud)
      const projectId = this.configService.get<string>('FIRESTORE_PROJECT_ID');
      if (projectId) {
        admin.initializeApp({
          projectId,
        });
        this.db = admin.firestore();
        this.isInitialized = true;
        return;
      }

      throw new Error(
        'Either FIRESTORE_APPLICATION_CREDENTIALS (path to JSON file), FIRESTORE_CREDENTIALS_JSON (JSON string), or FIRESTORE_PROJECT_ID (for default credentials) must be set'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error initializing Firestore:', errorMessage);
      throw new Error(`Failed to initialize Firestore: ${errorMessage}`);
    }
  }

  async getBonuses(): Promise<BonusDto[]> {
    // Lazy initialization - only initialize when actually needed
    if (!this.isInitialized) {
      await this.initializeFirestore();
    }

    try {
      const snapshot = await this.db.collection(this.collectionName).get();

      if (snapshot.empty) {
        return [];
      }

      const bonuses: BonusDto[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Parse tags from comma-separated string to array
        const tagsString = data.tags || '';
        const tags = tagsString
          ? tagsString
              .split(',')
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag.length > 0)
          : [];

        return {
          id: data.id || doc.id, // Use document id field if exists, otherwise use Firestore document ID
          brandName: data.brandName || '',
          logo: data.logo || '',
          welcomeBonus: data.welcomeBonus || '',
          bonusDetails: data.bonusDetails || '',
          wager: data.wager || '',
          minDeposit: data.minDeposit || '',
          trackingLink: data.trackingLink || '',
          tags,
          type: data.type || null,
        };
      });

      return bonuses;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error reading from Firestore:', errorMessage);
      throw new Error(`Failed to read bonuses from Firestore: ${errorMessage}`);
    }
  }
}

