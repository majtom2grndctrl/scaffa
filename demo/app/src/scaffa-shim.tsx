// ─────────────────────────────────────────────────────────────────────────────
// Scaffa Runtime Shim (DEPRECATED)
// ─────────────────────────────────────────────────────────────────────────────
// NOTE: This file is DEPRECATED and should no longer be used in app code.
//
// HARNESS MODEL (v0):
// Scaffa now injects instance identity and override application automatically
// via the vite-launcher's instrumentation plugin (ScaffaInstanceBoundary).
// Components in the registry are wrapped at dev-time, so app code does NOT
// need to import ScaffaInstance or useScaffaInstance.
//
// MIGRATION:
// 1. Remove all imports of ScaffaInstance and useScaffaInstance from components
// 2. Remove the manual ScaffaInstance wrapper from component exports
// 3. Remove useScaffaInstance calls from component bodies
// 4. Components should just accept and use their props directly
//
// The vite-launcher will automatically wrap registered components with
// ScaffaInstanceBoundary, which handles:
// - Instance identity (instanceId + componentTypeId)
// - Override application (props are modified before reaching your component)
// - Selection events (click-to-select in Editor View)
//
// See: docs/scaffa_harness_model.md (Section 5: Registry-Driven Instrumentation)

import React from 'react';
