/**
 * Project Migration Service
 * Stub implementation for project numbering migrations
 */

export interface MigrationProgress {
  current: number;
  total: number;
  status: string;
  currentBatch?: number;
  totalBatches?: number;
  processedProjects?: number;
  totalProjects?: number;
  message?: string;
}

export interface MigrationError {
  projectId: string;
  projectTitle: string;
  error: string;
  timestamp: Date;
}

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: MigrationError[];
  totalProjects?: number;
  migratedProjects?: number;
  skippedProjects?: number;
  failedProjects?: number;
  warnings?: string[];
  duration?: number;
}

export interface MigrationOptions {
  dryRun?: boolean;
  batchSize?: number;
  skipExisting?: boolean;
  yearFilter?: number;
  validateOnly?: boolean;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export class ProjectMigrationService {
  async migrate(options: MigrationOptions = {}): Promise<MigrationResult> {
    return {
      success: true,
      migratedCount: 0,
      errors: [],
      totalProjects: 0,
      migratedProjects: 0,
      skippedProjects: 0,
      failedProjects: 0,
      warnings: [],
      duration: 0
    };
  }

  async migrateExistingProjects(
    options: MigrationOptions = {},
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult> {
    if (onProgress) {
      onProgress({
        current: 0,
        total: 0,
        status: 'starting',
        currentBatch: 0,
        totalBatches: 0,
        processedProjects: 0,
        totalProjects: 0
      });
    }
    return this.migrate(options);
  }

  async getProgress(): Promise<MigrationProgress> {
    return {
      current: 0,
      total: 0,
      status: 'idle',
      currentBatch: 0,
      totalBatches: 0,
      processedProjects: 0,
      totalProjects: 0
    };
  }

  async getMigrationStats(): Promise<{
    totalProjects: number;
    projectsWithNumbers: number;
    projectsWithoutNumbers: number;
    yearBreakdown: Map<number, number>;
  }> {
    return {
      totalProjects: 0,
      projectsWithNumbers: 0,
      projectsWithoutNumbers: 0,
      yearBreakdown: new Map()
    };
  }
}
