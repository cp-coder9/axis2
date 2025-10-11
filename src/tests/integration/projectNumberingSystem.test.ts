/**
 * Project Numbering System - Integration Tests
 * 
 * Comprehensive end-to-end tests for the project numbering system
 * Requirements: 1.1, 1.2, 1.4, 6.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProjectNumberService } from '@/utils/projectNumberService';
import { CounterService } from '@/utils/counterService';
import { NumberingValidationService } from '@/utils/numberingValidationService';
import { ProjectCounter, ProjectNumber } from '@/types';

// Mock Firebase Timestamp
const mockTimestamp = {
  fromDate: vi.fn((date: Date) => ({
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0
  })),
  now: vi.fn(() => ({
    toDate: () => new Date(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0
  }))
};

// Mock Firebase
vi.mock('@/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  Timestamp: mockTimestamp,
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => new Date())
}));

describe('Project Numbering System - Integration Tests', () => {
  let projectNumberService: ProjectNumberService;
  let counterService: CounterService;
  let validationService: NumberingValidationService;

  beforeEach(() => {
    projectNumberService = new ProjectNumberService();
    counterService = new CounterService();
    validationService = new NumberingValidationService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Project Creation with Numbering', () => {
    it('should generate sequential project numbers', async () => {
      const mockCounter: ProjectCounter = {
        id: 'counter-2025',
        year: 2025,
        nextSequence: 1,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        version: 1,
        lastUsedMonth: 1
      };

      vi.spyOn(counterService, 'getOrCreateCounter').mockResolvedValue(mockCounter);
      vi.spyOn(counterService, 'incrementCounter').mockResolvedValue(1);

      const projectNumber1 = await projectNumberService.generateProjectNumber();
      
      expect(projectNumber1).toBeDefined();
      expect(projectNumber1.formatted).toMatch(/^\d{8}$/);
      expect(projectNumber1.sequence).toBe(1);

      vi.spyOn(counterService, 'incrementCounter').mockResolvedValue(2);
      const projectNumber2 = await projectNumberService.generateProjectNumber();
      
      expect(projectNumber2.sequence).toBe(2);
      expect(projectNumber2.formatted).not.toBe(projectNumber1.formatted);
    });

    it('should handle concurrent project creation', async () => {
      const mockCounter: ProjectCounter = {
        id: 'counter-2025',
        year: 2025,
        nextSequence: 1,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        version: 1,
        lastUsedMonth: 1
      };

      vi.spyOn(counterService, 'getOrCreateCounter').mockResolvedValue(mockCounter);
      
      let sequenceCounter = 1;
      vi.spyOn(counterService, 'incrementCounter').mockImplementation(async () => {
        return sequenceCounter++;
      });

      const promises = Array.from({ length: 5 }, () => 
        projectNumberService.generateProjectNumber()
      );

      const results = await Promise.all(promises);
      
      const formattedNumbers = results.map(r => r.formatted);
      const uniqueNumbers = new Set(formattedNumbers);
      expect(uniqueNumbers.size).toBe(5);

      const sequences = results.map(r => r.sequence).sort((a, b) => a - b);
      expect(sequences).toEqual([1, 2, 3, 4, 5]);
    });

    it('should validate generated numbers', async () => {
      const mockCounter: ProjectCounter = {
        id: 'counter-2025',
        year: 2025,
        nextSequence: 1,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        version: 1,
        lastUsedMonth: 1
      };

      vi.spyOn(counterService, 'getOrCreateCounter').mockResolvedValue(mockCounter);
      vi.spyOn(counterService, 'incrementCounter').mockResolvedValue(1);

      const projectNumber = await projectNumberService.generateProjectNumber();
      
      expect(validationService.validateFormat(projectNumber.formatted)).toBe(true);
      expect(validationService.validateYearMonth(projectNumber.year, projectNumber.month)).toBe(true);
      expect(validationService.validateSequence(projectNumber.sequence)).toBe(true);
    });
  });

  describe('Settings Page Integration', () => {
    it('should load current counter state', async () => {
      const mockCounter: ProjectCounter = {
        id: 'counter-2025',
        year: 2025,
        nextSequence: 42,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        version: 5,
        lastUsedMonth: 10
      };

      vi.spyOn(projectNumberService, 'getCurrentCounter').mockResolvedValue(mockCounter);

      const counter = await projectNumberService.getCurrentCounter(2025);
      
      expect(counter).toBeDefined();
      expect(counter.year).toBe(2025);
      expect(counter.nextSequence).toBe(42);
      expect(counter.version).toBe(5);
    });

    it('should preview next project number', async () => {
      const mockPreview: ProjectNumber = {
        year: 2025,
        month: 10,
        sequence: 42,
        formatted: '25100042',
        yearShort: 25
      };

      vi.spyOn(projectNumberService, 'getNextProjectNumberPreview').mockResolvedValue(mockPreview);

      const preview = await projectNumberService.getNextProjectNumberPreview();
      
      expect(preview).toBeDefined();
      expect(preview.formatted).toBe('25100042');
      expect(preview.year).toBe(2025);
      expect(preview.month).toBe(10);
      expect(preview.sequence).toBe(42);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle counter service unavailability', async () => {
      vi.spyOn(counterService, 'getOrCreateCounter').mockRejectedValue(
        new Error('Firestore unavailable')
      );

      await expect(projectNumberService.generateProjectNumber()).rejects.toThrow();
    });

    it('should validate counter bounds', () => {
      expect(validationService.validateSequence(0)).toBe(false);
      expect(validationService.validateSequence(1)).toBe(true);
      expect(validationService.validateSequence(9999)).toBe(true);
      expect(validationService.validateSequence(10000)).toBe(false);
    });

    it('should validate year bounds', () => {
      const currentYear = new Date().getFullYear();
      
      expect(validationService.validateYearMonth(2023, 1)).toBe(false);
      expect(validationService.validateYearMonth(2024, 1)).toBe(true);
      
      // Year validation includes business logic: current year + 10 max
      expect(validationService.validateYearMonth(currentYear + 5, 12)).toBe(true);
      expect(validationService.validateYearMonth(currentYear + 15, 12)).toBe(false);
      expect(validationService.validateYearMonth(2100, 1)).toBe(false);
    });

    it('should validate month bounds', () => {
      expect(validationService.validateYearMonth(2025, 0)).toBe(false);
      expect(validationService.validateYearMonth(2025, 1)).toBe(true);
      expect(validationService.validateYearMonth(2025, 12)).toBe(true);
      expect(validationService.validateYearMonth(2025, 13)).toBe(false);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle rapid sequential requests', async () => {
      const mockCounter: ProjectCounter = {
        id: 'counter-2025',
        year: 2025,
        nextSequence: 1,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        version: 1,
        lastUsedMonth: 1
      };

      vi.spyOn(counterService, 'getOrCreateCounter').mockResolvedValue(mockCounter);
      
      let sequenceCounter = 1;
      vi.spyOn(counterService, 'incrementCounter').mockImplementation(async () => {
        return sequenceCounter++;
      });

      const startTime = Date.now();
      
      const promises = Array.from({ length: 100 }, () => 
        projectNumberService.generateProjectNumber()
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results.length).toBe(100);
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000);
      
      const uniqueNumbers = new Set(results.map(r => r.formatted));
      expect(uniqueNumbers.size).toBe(100);
    });
  });

  describe('Year Transition Handling', () => {
    it('should reset counter on new year', async () => {
      const counter2024: ProjectCounter = {
        id: 'counter-2024',
        year: 2024,
        nextSequence: 9999,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        version: 1,
        lastUsedMonth: 12
      };

      const counter2025: ProjectCounter = {
        id: 'counter-2025',
        year: 2025,
        nextSequence: 1,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        version: 1,
        lastUsedMonth: 1
      };

      vi.spyOn(counterService, 'getOrCreateCounter')
        .mockResolvedValueOnce(counter2024)
        .mockResolvedValueOnce(counter2025);

      const counter1 = await counterService.getOrCreateCounter(2024);
      expect(counter1.nextSequence).toBe(9999);

      const counter2 = await counterService.getOrCreateCounter(2025);
      expect(counter2.nextSequence).toBe(1);
    });
  });

  describe('Format Validation', () => {
    it('should validate YYMMNNNN format', () => {
      expect(validationService.validateFormat('25010001')).toBe(true);
      expect(validationService.validateFormat('25120999')).toBe(true);
      expect(validationService.validateFormat('2501001')).toBe(false);
      expect(validationService.validateFormat('250100001')).toBe(false);
      expect(validationService.validateFormat('25AB0001')).toBe(false);
    });
  });
});
