import { describe, it, expect } from 'vitest';
import {
  createRouteId,
  createComponentTypeId,
  createRouteNode,
  createComponentTypeNode,
  createRouteUsesComponentTypeEdge,
  createComponentTypeUsesComponentTypeEdge,
} from './graph-helpers.js';

describe('Graph Construction Helpers', () => {
  describe('createRouteId', () => {
    it('should create RouteId with route: prefix from path', () => {
      const id = createRouteId('/');
      expect(id).toBe('route:/');
    });

    it('should handle nested paths', () => {
      const id = createRouteId('/dashboard/settings');
      expect(id).toBe('route:/dashboard/settings');
    });
  });

  describe('createComponentTypeId', () => {
    it('should create ComponentTypeId from string', () => {
      const id = createComponentTypeId('ui.button');
      expect(id).toBe('ui.button');
    });

    it('should handle namespaced component IDs', () => {
      const id = createComponentTypeId('layout.header.navbar');
      expect(id).toBe('layout.header.navbar');
    });
  });

  describe('createRouteNode', () => {
    it('should create route node with path-derived ID when routeId is not provided', () => {
      const node = createRouteNode({
        path: '/',
        filePath: 'src/app/page.tsx',
        line: 1,
      });

      expect(node).toEqual({
        kind: 'route',
        id: 'route:/',
        path: '/',
        source: {
          filePath: 'src/app/page.tsx',
          line: 1,
        },
      });
    });

    it('should create route node with explicit routeId when provided', () => {
      const node = createRouteNode({
        path: '/',
        routeId: 'home',
        filePath: 'src/app/page.tsx',
        line: 1,
      });

      expect(node).toEqual({
        kind: 'route',
        id: 'routeId:home',
        path: '/',
        source: {
          filePath: 'src/app/page.tsx',
          line: 1,
        },
      });
    });

    it('should handle nested paths with explicit routeId', () => {
      const node = createRouteNode({
        path: '/dashboard/settings',
        routeId: 'settings-route',
        filePath: 'src/app/settings/page.tsx',
        line: 10,
      });

      expect(node.id).toBe('routeId:settings-route');
      expect(node.path).toBe('/dashboard/settings');
    });

    it('should include column when provided', () => {
      const node = createRouteNode({
        path: '/about',
        filePath: 'src/app/about.tsx',
        line: 5,
        column: 10,
      });

      expect(node.source?.column).toBe(10);
    });

    it('should handle index routes with explicit routeId', () => {
      const node = createRouteNode({
        path: '/',
        routeId: 'index',
        filePath: 'src/app/index.tsx',
        line: 1,
      });

      expect(node.id).toBe('routeId:index');
      expect(node.path).toBe('/');
    });

    it('should handle routeId with hyphens and underscores', () => {
      const node = createRouteNode({
        path: '/user-profile',
        routeId: 'user_profile_route',
        filePath: 'src/app/profile.tsx',
        line: 1,
      });

      expect(node.id).toBe('routeId:user_profile_route');
    });

    it('should handle empty string routeId', () => {
      const node = createRouteNode({
        path: '/empty',
        routeId: '',
        filePath: 'src/app/empty.tsx',
        line: 1,
      });

      // Empty routeId still gets prefixed
      expect(node.id).toBe('routeId:');
    });

    it('should reject routeId containing colon', () => {
      expect(() =>
        createRouteNode({
          path: '/test',
          routeId: 'route:home',
          filePath: 'src/app/test.tsx',
          line: 1,
        })
      ).toThrow(/Invalid routeId.*must not contain ':'/);
    });

    it('should reject routeId containing slash', () => {
      expect(() =>
        createRouteNode({
          path: '/test',
          routeId: 'route/home',
          filePath: 'src/app/test.tsx',
          line: 1,
        })
      ).toThrow(/Invalid routeId.*must not contain.*'\/'/);
    });

    it('should reject routeId containing both colon and slash', () => {
      expect(() =>
        createRouteNode({
          path: '/test',
          routeId: 'route:/home',
          filePath: 'src/app/test.tsx',
          line: 1,
        })
      ).toThrow(/Invalid routeId/);
    });
  });

  describe('createComponentTypeNode', () => {
    it('should create component type node with proper structure', () => {
      const node = createComponentTypeNode({
        id: 'ui.button',
        displayName: 'Button',
        filePath: 'src/components/Button.tsx',
        line: 5,
      });

      expect(node).toEqual({
        kind: 'componentType',
        id: 'ui.button',
        displayName: 'Button',
        source: {
          filePath: 'src/components/Button.tsx',
          line: 5,
        },
      });
    });

    it('should include column when provided', () => {
      const node = createComponentTypeNode({
        id: 'ui.card',
        displayName: 'Card',
        filePath: 'src/components/Card.tsx',
        line: 10,
        column: 15,
      });

      expect(node.source?.column).toBe(15);
    });
  });

  describe('createRouteUsesComponentTypeEdge', () => {
    it('should create edge with properly typed IDs', () => {
      const edge = createRouteUsesComponentTypeEdge({
        routePath: '/',
        componentTypeId: 'ui.button',
      });

      expect(edge).toEqual({
        kind: 'routeUsesComponentType',
        routeId: 'route:/',
        componentTypeId: 'ui.button',
      });
    });

    it('should handle nested route paths', () => {
      const edge = createRouteUsesComponentTypeEdge({
        routePath: '/dashboard/analytics',
        componentTypeId: 'charts.line',
      });

      expect(edge.routeId).toBe('route:/dashboard/analytics');
    });
  });

  describe('createComponentTypeUsesComponentTypeEdge', () => {
    it('should create edge with properly typed IDs', () => {
      const edge = createComponentTypeUsesComponentTypeEdge({
        from: 'layout.header',
        to: 'ui.button',
      });

      expect(edge).toEqual({
        kind: 'componentTypeUsesComponentType',
        from: 'layout.header',
        to: 'ui.button',
      });
    });
  });
});
