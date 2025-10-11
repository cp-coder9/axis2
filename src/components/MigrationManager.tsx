import React, { useState, useEffect } from 'react';
import { ProjectMigrationService, MigrationResult, MigrationProgress, MigrationOptions } from '../../utils/projectMigrationService';

interface MigrationManagerProps {
    userId: string;
    userName: string;
    userEmail: string;
}

/**
 * MigrationManager Component
 * 
 * Admin interface for managing project numbering migrations.
 * Provides controls for running migrations, viewing progress, and handling rollbacks.
 * 
 * Requirements addressed:
 * - 5.4: Manual intervention tools for counter management
 * - 4.3: Counter initialization based on existing project data
 */
export const MigrationManager: React.FC<MigrationManagerProps> = ({
    userId,
    userName,
    userEmail
}) => {
    const [migrationService] = useState(() => new ProjectMigrationService());
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState<MigrationProgress | null>(null);
    const [result, setResult] = useState<MigrationResult | null>(null);
    const [stats, setStats] = useState<{
        totalProjects: number;
        projectsWithNumbers: number;
        projectsWithoutNumbers: number;
        yearBreakdown: Map<number, number>;
    } | null>(null);

    // Migration options
    const [batchSize, setBatchSize] = useState(50);
    const [dryRun, setDryRun] = useState(true);
    const [skipExisting, setSkipExisting] = useState(true);
    const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);

    // Load stats on mount
    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const migrationStats = await migrationService.getMigrationStats();
            setStats(migrationStats);
        } catch (error) {
            console.error('Failed to load migration stats:', error);
        }
    };

    const handleMigration = async (validateOnly: boolean = false) => {
        setIsLoading(true);
        setResult(null);
        setProgress(null);

        const options: MigrationOptions = {
            batchSize,
            dryRun,
            skipExisting,
            yearFilter,
            validateOnly,
            userId,
            userName,
            userEmail
        };

        try {
            const migrationResult = await migrationService.migrateExistingProjects(
                options,
                (progressUpdate) => {
                    setProgress(progressUpdate);
                }
            );

            setResult(migrationResult);
            await loadStats(); // Refresh stats after migration
        } catch (error) {
            console.error('Migration failed:', error);
            setResult({
                success: false,
                totalProjects: 0,
                migratedProjects: 0,
                skippedProjects: 0,
                failedProjects: 0,
                errors: [{
                    projectId: 'N/A',
                    projectTitle: 'Migration',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date()
                }],
                warnings: [],
                duration: 0
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRollback = async () => {
        if (!result || result.migratedProjects === 0) {
            alert('No migration to rollback');
            return;
        }

        if (!confirm(`Are you sure you want to rollback the migration? This will remove reference numbers from ${result.migratedProjects} projects.`)) {
            return;
        }

        setIsLoading(true);
        try {
            // Note: In a real implementation, you'd need to track which projects were migrated
            // For now, this is a placeholder
            alert('Rollback functionality requires tracking migrated project IDs. Please implement project ID tracking in the migration result.');
        } catch (error) {
            console.error('Rollback failed:', error);
            alert(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (ms: number): string => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}m ${seconds}s`;
    };

    return (
        <div className="migration-manager p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Project Numbering Migration</h2>

            {/* Statistics Section */}
            {stats && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Database Statistics</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Total Projects</p>
                            <p className="text-2xl font-bold">{stats.totalProjects}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">With Numbers</p>
                            <p className="text-2xl font-bold text-green-600">{stats.projectsWithNumbers}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Without Numbers</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.projectsWithoutNumbers}</p>
                        </div>
                    </div>

                    {stats.yearBreakdown.size > 0 && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Year Breakdown:</p>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(stats.yearBreakdown.entries())
                                    .sort((a, b) => a[0] - b[0])
                                    .map(([year, count]) => (
                                        <span key={year} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                            {year}: {count}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Configuration Section */}
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Migration Options</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Batch Size
                        </label>
                        <input
                            type="number"
                            value={batchSize}
                            onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
                            min="1"
                            max="500"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Year Filter (optional)
                        </label>
                        <input
                            type="number"
                            value={yearFilter || ''}
                            onChange={(e) => setYearFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="All years"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={dryRun}
                            onChange={(e) => setDryRun(e.target.checked)}
                            className="mr-2"
                            disabled={isLoading}
                        />
                        <span className="text-sm">Dry Run (simulate without writing)</span>
                    </label>

                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={skipExisting}
                            onChange={(e) => setSkipExisting(e.target.checked)}
                            className="mr-2"
                            disabled={isLoading}
                        />
                        <span className="text-sm">Skip projects with existing numbers</span>
                    </label>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-6 flex gap-3">
                <button
                    onClick={() => handleMigration(true)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Validate Only
                </button>

                <button
                    onClick={() => handleMigration(false)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {dryRun ? 'Run Dry Run' : 'Run Migration'}
                </button>

                <button
                    onClick={loadStats}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Refresh Stats
                </button>

                {result && result.migratedProjects > 0 && !dryRun && (
                    <button
                        onClick={handleRollback}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Rollback
                    </button>
                )}
            </div>

            {/* Progress Section */}
            {progress && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Progress</h3>
                    <p className="text-sm mb-2">
                        <span className="font-medium">Status:</span> {progress.status.toUpperCase()}
                    </p>
                    <p className="text-sm mb-2">
                        <span className="font-medium">Batch:</span> {progress.currentBatch} / {progress.totalBatches}
                    </p>
                    <p className="text-sm mb-3">
                        <span className="font-medium">Progress:</span> {progress.processedProjects} / {progress.totalProjects}
                        {progress.totalProjects > 0 && (
                            <span className="ml-2">
                                ({((progress.processedProjects / progress.totalProjects) * 100).toFixed(1)}%)
                            </span>
                        )}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{
                                width: progress.totalProjects > 0
                                    ? `${(progress.processedProjects / progress.totalProjects) * 100}%`
                                    : '0%'
                            }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-600">{progress.message}</p>
                </div>
            )}

            {/* Results Section */}
            {result && (
                <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <h3 className="text-lg font-semibold mb-3">
                        {result.success ? '✅ Migration Completed' : '❌ Migration Failed'}
                    </h3>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-xl font-bold">{result.totalProjects}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Migrated</p>
                            <p className="text-xl font-bold text-green-600">{result.migratedProjects}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Skipped</p>
                            <p className="text-xl font-bold text-gray-600">{result.skippedProjects}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Failed</p>
                            <p className="text-xl font-bold text-red-600">{result.failedProjects}</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        Duration: {formatDuration(result.duration)}
                    </p>

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-semibold text-orange-700 mb-2">Warnings:</h4>
                            <ul className="list-disc list-inside space-y-1">
                                {result.warnings.map((warning, index) => (
                                    <li key={index} className="text-sm text-orange-600">{warning}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Errors */}
                    {result.errors.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-red-700 mb-2">Errors:</h4>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {result.errors.map((error, index) => (
                                    <div key={index} className="p-2 bg-white rounded border border-red-200">
                                        <p className="text-sm font-medium">{error.projectTitle} ({error.projectId})</p>
                                        <p className="text-sm text-red-600">{error.error}</p>
                                        <p className="text-xs text-gray-500">{error.timestamp.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
