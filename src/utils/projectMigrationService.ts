/**
 * Project Migration Service
 * Stub implementation for project numbering migrations
 */

export interface MigrationProgress {
  current: number;
  total: number;
  status: string;
}

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
}

export interface MigrationOptions {
  dryRun?: boolean;
  batchSize?: number;
}

export class ProjectMigrationService {
  async migrate(options: MigrationOptions = {}): Promise<MigrationResult> {
    return {
      success: true,
      migratedCount: 0,
      errors: []
    };
  }

  async getProgress(): Promise<MigrationProgress> {
    return {
      current: 0,
      total: 0,
      status: 'idle'
    };
  }
}
