import { describe, it, expect, beforeEach } from 'vitest';
import { inspectorSectionRegistry } from './inspector-section-registry.js';
import type { InspectorSectionContribution } from '../../shared/inspector-sections.js';

describe('InspectorSectionRegistry', () => {
  beforeEach(() => {
    // Clear registry before each test
    inspectorSectionRegistry.clear();
  });

  it('should register a section', () => {
    const section: InspectorSectionContribution = {
      id: 'test-section' as any,
      title: 'Test Section',
      order: 1000,
      extensionId: 'test-extension',
      componentPath: 'test/path.js',
      componentExport: 'default',
    };

    inspectorSectionRegistry.registerSection(section);

    const sections = inspectorSectionRegistry.getSections();
    expect(sections).toHaveLength(1);
    expect(sections[0]).toEqual(section);
  });

  it('should sort sections by order', () => {
    const section1: InspectorSectionContribution = {
      id: 'section-1' as any,
      title: 'Section 1',
      order: 2000,
      extensionId: 'ext1',
      componentPath: 'path1.js',
      componentExport: 'default',
    };

    const section2: InspectorSectionContribution = {
      id: 'section-2' as any,
      title: 'Section 2',
      order: 1000,
      extensionId: 'ext2',
      componentPath: 'path2.js',
      componentExport: 'default',
    };

    const section3: InspectorSectionContribution = {
      id: 'section-3' as any,
      title: 'Section 3',
      order: 1500,
      extensionId: 'ext3',
      componentPath: 'path3.js',
      componentExport: 'default',
    };

    // Register in random order
    inspectorSectionRegistry.registerSection(section1);
    inspectorSectionRegistry.registerSection(section2);
    inspectorSectionRegistry.registerSection(section3);

    const sections = inspectorSectionRegistry.getSections();
    expect(sections).toHaveLength(3);
    // Should be sorted by order ascending
    expect(sections[0].id).toBe('section-2');
    expect(sections[1].id).toBe('section-3');
    expect(sections[2].id).toBe('section-1');
  });

  it('should retrieve a specific section by ID', () => {
    const section: InspectorSectionContribution = {
      id: 'test-section' as any,
      title: 'Test Section',
      order: 1000,
      extensionId: 'test-extension',
      componentPath: 'test/path.js',
      componentExport: 'default',
    };

    inspectorSectionRegistry.registerSection(section);

    const retrieved = inspectorSectionRegistry.getSection('test-section' as any);
    expect(retrieved).toEqual(section);
  });

  it('should return undefined for non-existent section', () => {
    const retrieved = inspectorSectionRegistry.getSection('non-existent' as any);
    expect(retrieved).toBeUndefined();
  });

  it('should unregister a section', () => {
    const section: InspectorSectionContribution = {
      id: 'test-section' as any,
      title: 'Test Section',
      order: 1000,
      extensionId: 'test-extension',
      componentPath: 'test/path.js',
      componentExport: 'default',
    };

    inspectorSectionRegistry.registerSection(section);
    expect(inspectorSectionRegistry.getSections()).toHaveLength(1);

    inspectorSectionRegistry.unregisterSection('test-section' as any);
    expect(inspectorSectionRegistry.getSections()).toHaveLength(0);
  });

  it('should clear all sections', () => {
    const section1: InspectorSectionContribution = {
      id: 'section-1' as any,
      title: 'Section 1',
      order: 1000,
      extensionId: 'ext1',
      componentPath: 'path1.js',
      componentExport: 'default',
    };

    const section2: InspectorSectionContribution = {
      id: 'section-2' as any,
      title: 'Section 2',
      order: 2000,
      extensionId: 'ext2',
      componentPath: 'path2.js',
      componentExport: 'default',
    };

    inspectorSectionRegistry.registerSection(section1);
    inspectorSectionRegistry.registerSection(section2);
    expect(inspectorSectionRegistry.getSections()).toHaveLength(2);

    inspectorSectionRegistry.clear();
    expect(inspectorSectionRegistry.getSections()).toHaveLength(0);
  });

  it('should handle duplicate section IDs by overwriting', () => {
    const section1: InspectorSectionContribution = {
      id: 'test-section' as any,
      title: 'Section 1',
      order: 1000,
      extensionId: 'ext1',
      componentPath: 'path1.js',
      componentExport: 'default',
    };

    const section2: InspectorSectionContribution = {
      id: 'test-section' as any,
      title: 'Section 2',
      order: 2000,
      extensionId: 'ext2',
      componentPath: 'path2.js',
      componentExport: 'default',
    };

    inspectorSectionRegistry.registerSection(section1);
    inspectorSectionRegistry.registerSection(section2);

    const sections = inspectorSectionRegistry.getSections();
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Section 2');
  });
});
