/** @typedef {import('zod').infer<typeof ScaffaConfigSchema>} ScaffaConfig */
/**
 * Helper function for user-facing config definition.
 * This will be exported from @scaffa/config package.
 *
 * @param {ScaffaConfig} config
 * @returns {ScaffaConfig}
 */
export function defineScaffaConfig(config: ScaffaConfig): ScaffaConfig;
/**
 * Module instance contributed to the project.
 * v0: Simple path-based loading. Future: factory functions + npm packages.
 */
export const ScaffaModuleSchema: z.ZodObject<{
    id: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
    /**
     * Optional npm package specifier for package-based modules.
     * When provided, the extension host will resolve it using Node's module resolution
     * anchored at the workspace root (directory containing scaffa.config.js).
     *
     * Examples:
     * - "@scaffa/module-react-router"
     * - "./relative-package" (workspace local via package.json "name")
     */
    package: z.ZodOptional<z.ZodString>;
    contributions: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    path?: string;
    package?: string;
    contributions?: unknown;
}, {
    id?: string;
    path?: string;
    package?: string;
    contributions?: unknown;
}>;
/** @typedef {import('zod').infer<typeof ScaffaModuleSchema>} ScaffaModule */
/**
 * Preview decorator function (opaque at config layer).
 */
export const PreviewDecoratorSchema: z.ZodUnknown;
/** @typedef {import('zod').infer<typeof PreviewDecoratorSchema>} PreviewDecorator */
/**
 * Preview configuration.
 */
export const PreviewConfigSchema: z.ZodObject<{
    /**
     * Harness Model: module specifier for the preview root component.
     * Example: "./src/App.tsx"
     */
    entry: z.ZodOptional<z.ZodString>;
    /**
     * Harness Model: list of style module specifiers to import before mounting.
     * Example: ["./src/index.css"]
     */
    styles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    decorators: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    environment: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /**
     * Optional default launcher preference for `app` sessions.
     * The Preview Session Target still carries the authoritative `launcherId`.
     */
    launcher: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        options?: Record<string, unknown>;
    }, {
        id?: string;
        options?: Record<string, unknown>;
    }>>;
}, "strip", z.ZodTypeAny, {
    entry?: string;
    styles?: string[];
    decorators?: unknown[];
    environment?: Record<string, unknown>;
    launcher?: {
        id?: string;
        options?: Record<string, unknown>;
    };
}, {
    entry?: string;
    styles?: string[];
    decorators?: unknown[];
    environment?: Record<string, unknown>;
    launcher?: {
        id?: string;
        options?: Record<string, unknown>;
    };
}>;
/** @typedef {import('zod').infer<typeof PreviewConfigSchema>} PreviewConfig */
/**
 * Control definition override for a prop.
 */
export const ControlOverrideSchema: z.ZodObject<{
    kind: z.ZodOptional<z.ZodEnum<["string", "number", "boolean", "select", "color", "slot", "json"]>>;
    options: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    options?: unknown;
    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
}, {
    options?: unknown;
    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
}>;
/** @typedef {import('zod').infer<typeof ControlOverrideSchema>} ControlOverride */
/**
 * Prop exposure override.
 */
export const PropExposureOverrideSchema: z.ZodObject<{
    kind: z.ZodOptional<z.ZodEnum<["editable", "inspectOnly", "opaque"]>>;
    control: z.ZodOptional<z.ZodObject<{
        kind: z.ZodOptional<z.ZodEnum<["string", "number", "boolean", "select", "color", "slot", "json"]>>;
        options: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        options?: unknown;
        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
    }, {
        options?: unknown;
        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
    }>>;
    uiDefaultValue: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    kind?: "editable" | "inspectOnly" | "opaque";
    control?: {
        options?: unknown;
        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
    };
    uiDefaultValue?: unknown;
}, {
    kind?: "editable" | "inspectOnly" | "opaque";
    control?: {
        options?: unknown;
        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
    };
    uiDefaultValue?: unknown;
}>;
/** @typedef {import('zod').infer<typeof PropExposureOverrideSchema>} PropExposureOverride */
/**
 * Prop-level override.
 */
export const PropOverrideSchema: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    group: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
    exposure: z.ZodOptional<z.ZodObject<{
        kind: z.ZodOptional<z.ZodEnum<["editable", "inspectOnly", "opaque"]>>;
        control: z.ZodOptional<z.ZodObject<{
            kind: z.ZodOptional<z.ZodEnum<["string", "number", "boolean", "select", "color", "slot", "json"]>>;
            options: z.ZodOptional<z.ZodUnknown>;
        }, "strip", z.ZodTypeAny, {
            options?: unknown;
            kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
        }, {
            options?: unknown;
            kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
        }>>;
        uiDefaultValue: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        kind?: "editable" | "inspectOnly" | "opaque";
        control?: {
            options?: unknown;
            kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
        };
        uiDefaultValue?: unknown;
    }, {
        kind?: "editable" | "inspectOnly" | "opaque";
        control?: {
            options?: unknown;
            kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
        };
        uiDefaultValue?: unknown;
    }>>;
}, "strip", z.ZodTypeAny, {
    label?: string;
    description?: string;
    group?: string;
    order?: number;
    exposure?: {
        kind?: "editable" | "inspectOnly" | "opaque";
        control?: {
            options?: unknown;
            kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
        };
        uiDefaultValue?: unknown;
    };
}, {
    label?: string;
    description?: string;
    group?: string;
    order?: number;
    exposure?: {
        kind?: "editable" | "inspectOnly" | "opaque";
        control?: {
            options?: unknown;
            kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
        };
        uiDefaultValue?: unknown;
    };
}>;
/** @typedef {import('zod').infer<typeof PropOverrideSchema>} PropOverride */
/**
 * Component-level override.
 */
export const ComponentOverrideSchema: z.ZodObject<{
    disabled: z.ZodOptional<z.ZodBoolean>;
    displayName: z.ZodOptional<z.ZodString>;
    props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        group: z.ZodOptional<z.ZodString>;
        order: z.ZodOptional<z.ZodNumber>;
        exposure: z.ZodOptional<z.ZodObject<{
            kind: z.ZodOptional<z.ZodEnum<["editable", "inspectOnly", "opaque"]>>;
            control: z.ZodOptional<z.ZodObject<{
                kind: z.ZodOptional<z.ZodEnum<["string", "number", "boolean", "select", "color", "slot", "json"]>>;
                options: z.ZodOptional<z.ZodUnknown>;
            }, "strip", z.ZodTypeAny, {
                options?: unknown;
                kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
            }, {
                options?: unknown;
                kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
            }>>;
            uiDefaultValue: z.ZodOptional<z.ZodUnknown>;
        }, "strip", z.ZodTypeAny, {
            kind?: "editable" | "inspectOnly" | "opaque";
            control?: {
                options?: unknown;
                kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
            };
            uiDefaultValue?: unknown;
        }, {
            kind?: "editable" | "inspectOnly" | "opaque";
            control?: {
                options?: unknown;
                kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
            };
            uiDefaultValue?: unknown;
        }>>;
    }, "strip", z.ZodTypeAny, {
        label?: string;
        description?: string;
        group?: string;
        order?: number;
        exposure?: {
            kind?: "editable" | "inspectOnly" | "opaque";
            control?: {
                options?: unknown;
                kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
            };
            uiDefaultValue?: unknown;
        };
    }, {
        label?: string;
        description?: string;
        group?: string;
        order?: number;
        exposure?: {
            kind?: "editable" | "inspectOnly" | "opaque";
            control?: {
                options?: unknown;
                kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
            };
            uiDefaultValue?: unknown;
        };
    }>>>;
}, "strip", z.ZodTypeAny, {
    disabled?: boolean;
    displayName?: string;
    props?: Record<string, {
        label?: string;
        description?: string;
        group?: string;
        order?: number;
        exposure?: {
            kind?: "editable" | "inspectOnly" | "opaque";
            control?: {
                options?: unknown;
                kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
            };
            uiDefaultValue?: unknown;
        };
    }>;
}, {
    disabled?: boolean;
    displayName?: string;
    props?: Record<string, {
        label?: string;
        description?: string;
        group?: string;
        order?: number;
        exposure?: {
            kind?: "editable" | "inspectOnly" | "opaque";
            control?: {
                options?: unknown;
                kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
            };
            uiDefaultValue?: unknown;
        };
    }>;
}>;
/** @typedef {import('zod').infer<typeof ComponentOverrideSchema>} ComponentOverride */
/**
 * Component registry overrides.
 */
export const ComponentsConfigSchema: z.ZodObject<{
    overrides: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        disabled: z.ZodOptional<z.ZodBoolean>;
        displayName: z.ZodOptional<z.ZodString>;
        props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            group: z.ZodOptional<z.ZodString>;
            order: z.ZodOptional<z.ZodNumber>;
            exposure: z.ZodOptional<z.ZodObject<{
                kind: z.ZodOptional<z.ZodEnum<["editable", "inspectOnly", "opaque"]>>;
                control: z.ZodOptional<z.ZodObject<{
                    kind: z.ZodOptional<z.ZodEnum<["string", "number", "boolean", "select", "color", "slot", "json"]>>;
                    options: z.ZodOptional<z.ZodUnknown>;
                }, "strip", z.ZodTypeAny, {
                    options?: unknown;
                    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                }, {
                    options?: unknown;
                    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                }>>;
                uiDefaultValue: z.ZodOptional<z.ZodUnknown>;
            }, "strip", z.ZodTypeAny, {
                kind?: "editable" | "inspectOnly" | "opaque";
                control?: {
                    options?: unknown;
                    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                };
                uiDefaultValue?: unknown;
            }, {
                kind?: "editable" | "inspectOnly" | "opaque";
                control?: {
                    options?: unknown;
                    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                };
                uiDefaultValue?: unknown;
            }>>;
        }, "strip", z.ZodTypeAny, {
            label?: string;
            description?: string;
            group?: string;
            order?: number;
            exposure?: {
                kind?: "editable" | "inspectOnly" | "opaque";
                control?: {
                    options?: unknown;
                    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                };
                uiDefaultValue?: unknown;
            };
        }, {
            label?: string;
            description?: string;
            group?: string;
            order?: number;
            exposure?: {
                kind?: "editable" | "inspectOnly" | "opaque";
                control?: {
                    options?: unknown;
                    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                };
                uiDefaultValue?: unknown;
            };
        }>>>;
    }, "strip", z.ZodTypeAny, {
        disabled?: boolean;
        displayName?: string;
        props?: Record<string, {
            label?: string;
            description?: string;
            group?: string;
            order?: number;
            exposure?: {
                kind?: "editable" | "inspectOnly" | "opaque";
                control?: {
                    options?: unknown;
                    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                };
                uiDefaultValue?: unknown;
            };
        }>;
    }, {
        disabled?: boolean;
        displayName?: string;
        props?: Record<string, {
            label?: string;
            description?: string;
            group?: string;
            order?: number;
            exposure?: {
                kind?: "editable" | "inspectOnly" | "opaque";
                control?: {
                    options?: unknown;
                    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                };
                uiDefaultValue?: unknown;
            };
        }>;
    }>>>;
}, "strip", z.ZodTypeAny, {
    overrides?: Record<string, {
        disabled?: boolean;
        displayName?: string;
        props?: Record<string, {
            label?: string;
            description?: string;
            group?: string;
            order?: number;
            exposure?: {
                kind?: "editable" | "inspectOnly" | "opaque";
                control?: {
                    options?: unknown;
                    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                };
                uiDefaultValue?: unknown;
            };
        }>;
    }>;
}, {
    overrides?: Record<string, {
        disabled?: boolean;
        displayName?: string;
        props?: Record<string, {
            label?: string;
            description?: string;
            group?: string;
            order?: number;
            exposure?: {
                kind?: "editable" | "inspectOnly" | "opaque";
                control?: {
                    options?: unknown;
                    kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                };
                uiDefaultValue?: unknown;
            };
        }>;
    }>;
}>;
/** @typedef {import('zod').infer<typeof ComponentsConfigSchema>} ComponentsConfig */
/**
 * AI prompt template (Phase 1 placeholder).
 */
export const PromptTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    template: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: string;
    template?: string;
}, {
    name?: string;
    template?: string;
}>;
/** @typedef {import('zod').infer<typeof PromptTemplateSchema>} PromptTemplate */
/**
 * AI configuration.
 */
export const AiConfigSchema: z.ZodObject<{
    prompts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        template: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        template?: string;
    }, {
        name?: string;
        template?: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    prompts?: {
        name?: string;
        template?: string;
    }[];
}, {
    prompts?: {
        name?: string;
        template?: string;
    }[];
}>;
/** @typedef {import('zod').infer<typeof AiConfigSchema>} AiConfig */
/**
 * Full scaffa.config.js schema.
 */
export const ScaffaConfigSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodOptional<z.ZodLiteral<"v0">>>;
    modules: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        /**
         * Optional npm package specifier for package-based modules.
         * When provided, the extension host will resolve it using Node's module resolution
         * anchored at the workspace root (directory containing scaffa.config.js).
         *
         * Examples:
         * - "@scaffa/module-react-router"
         * - "./relative-package" (workspace local via package.json "name")
         */
        package: z.ZodOptional<z.ZodString>;
        contributions: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        path?: string;
        package?: string;
        contributions?: unknown;
    }, {
        id?: string;
        path?: string;
        package?: string;
        contributions?: unknown;
    }>, "many">>>;
    preview: z.ZodOptional<z.ZodObject<{
        /**
         * Harness Model: module specifier for the preview root component.
         * Example: "./src/App.tsx"
         */
        entry: z.ZodOptional<z.ZodString>;
        /**
         * Harness Model: list of style module specifiers to import before mounting.
         * Example: ["./src/index.css"]
         */
        styles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        decorators: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
        environment: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        /**
         * Optional default launcher preference for `app` sessions.
         * The Preview Session Target still carries the authoritative `launcherId`.
         */
        launcher: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            id?: string;
            options?: Record<string, unknown>;
        }, {
            id?: string;
            options?: Record<string, unknown>;
        }>>;
    }, "strip", z.ZodTypeAny, {
        entry?: string;
        styles?: string[];
        decorators?: unknown[];
        environment?: Record<string, unknown>;
        launcher?: {
            id?: string;
            options?: Record<string, unknown>;
        };
    }, {
        entry?: string;
        styles?: string[];
        decorators?: unknown[];
        environment?: Record<string, unknown>;
        launcher?: {
            id?: string;
            options?: Record<string, unknown>;
        };
    }>>;
    components: z.ZodOptional<z.ZodObject<{
        overrides: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            disabled: z.ZodOptional<z.ZodBoolean>;
            displayName: z.ZodOptional<z.ZodString>;
            props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                label: z.ZodOptional<z.ZodString>;
                description: z.ZodOptional<z.ZodString>;
                group: z.ZodOptional<z.ZodString>;
                order: z.ZodOptional<z.ZodNumber>;
                exposure: z.ZodOptional<z.ZodObject<{
                    kind: z.ZodOptional<z.ZodEnum<["editable", "inspectOnly", "opaque"]>>;
                    control: z.ZodOptional<z.ZodObject<{
                        kind: z.ZodOptional<z.ZodEnum<["string", "number", "boolean", "select", "color", "slot", "json"]>>;
                        options: z.ZodOptional<z.ZodUnknown>;
                    }, "strip", z.ZodTypeAny, {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    }, {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    }>>;
                    uiDefaultValue: z.ZodOptional<z.ZodUnknown>;
                }, "strip", z.ZodTypeAny, {
                    kind?: "editable" | "inspectOnly" | "opaque";
                    control?: {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    };
                    uiDefaultValue?: unknown;
                }, {
                    kind?: "editable" | "inspectOnly" | "opaque";
                    control?: {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    };
                    uiDefaultValue?: unknown;
                }>>;
            }, "strip", z.ZodTypeAny, {
                label?: string;
                description?: string;
                group?: string;
                order?: number;
                exposure?: {
                    kind?: "editable" | "inspectOnly" | "opaque";
                    control?: {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    };
                    uiDefaultValue?: unknown;
                };
            }, {
                label?: string;
                description?: string;
                group?: string;
                order?: number;
                exposure?: {
                    kind?: "editable" | "inspectOnly" | "opaque";
                    control?: {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    };
                    uiDefaultValue?: unknown;
                };
            }>>>;
        }, "strip", z.ZodTypeAny, {
            disabled?: boolean;
            displayName?: string;
            props?: Record<string, {
                label?: string;
                description?: string;
                group?: string;
                order?: number;
                exposure?: {
                    kind?: "editable" | "inspectOnly" | "opaque";
                    control?: {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    };
                    uiDefaultValue?: unknown;
                };
            }>;
        }, {
            disabled?: boolean;
            displayName?: string;
            props?: Record<string, {
                label?: string;
                description?: string;
                group?: string;
                order?: number;
                exposure?: {
                    kind?: "editable" | "inspectOnly" | "opaque";
                    control?: {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    };
                    uiDefaultValue?: unknown;
                };
            }>;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        overrides?: Record<string, {
            disabled?: boolean;
            displayName?: string;
            props?: Record<string, {
                label?: string;
                description?: string;
                group?: string;
                order?: number;
                exposure?: {
                    kind?: "editable" | "inspectOnly" | "opaque";
                    control?: {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    };
                    uiDefaultValue?: unknown;
                };
            }>;
        }>;
    }, {
        overrides?: Record<string, {
            disabled?: boolean;
            displayName?: string;
            props?: Record<string, {
                label?: string;
                description?: string;
                group?: string;
                order?: number;
                exposure?: {
                    kind?: "editable" | "inspectOnly" | "opaque";
                    control?: {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    };
                    uiDefaultValue?: unknown;
                };
            }>;
        }>;
    }>>;
    ai: z.ZodOptional<z.ZodObject<{
        prompts: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            template: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name?: string;
            template?: string;
        }, {
            name?: string;
            template?: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        prompts?: {
            name?: string;
            template?: string;
        }[];
    }, {
        prompts?: {
            name?: string;
            template?: string;
        }[];
    }>>;
}, "strip", z.ZodTypeAny, {
    schemaVersion?: "v0";
    modules?: {
        id?: string;
        path?: string;
        package?: string;
        contributions?: unknown;
    }[];
    preview?: {
        entry?: string;
        styles?: string[];
        decorators?: unknown[];
        environment?: Record<string, unknown>;
        launcher?: {
            id?: string;
            options?: Record<string, unknown>;
        };
    };
    components?: {
        overrides?: Record<string, {
            disabled?: boolean;
            displayName?: string;
            props?: Record<string, {
                label?: string;
                description?: string;
                group?: string;
                order?: number;
                exposure?: {
                    kind?: "editable" | "inspectOnly" | "opaque";
                    control?: {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    };
                    uiDefaultValue?: unknown;
                };
            }>;
        }>;
    };
    ai?: {
        prompts?: {
            name?: string;
            template?: string;
        }[];
    };
}, {
    schemaVersion?: "v0";
    modules?: {
        id?: string;
        path?: string;
        package?: string;
        contributions?: unknown;
    }[];
    preview?: {
        entry?: string;
        styles?: string[];
        decorators?: unknown[];
        environment?: Record<string, unknown>;
        launcher?: {
            id?: string;
            options?: Record<string, unknown>;
        };
    };
    components?: {
        overrides?: Record<string, {
            disabled?: boolean;
            displayName?: string;
            props?: Record<string, {
                label?: string;
                description?: string;
                group?: string;
                order?: number;
                exposure?: {
                    kind?: "editable" | "inspectOnly" | "opaque";
                    control?: {
                        options?: unknown;
                        kind?: "string" | "number" | "boolean" | "select" | "color" | "slot" | "json";
                    };
                    uiDefaultValue?: unknown;
                };
            }>;
        }>;
    };
    ai?: {
        prompts?: {
            name?: string;
            template?: string;
        }[];
    };
}>;
export type ScaffaConfig = import("zod").infer<typeof ScaffaConfigSchema>;
export type ScaffaModule = import("zod").infer<typeof ScaffaModuleSchema>;
export type PreviewDecorator = import("zod").infer<typeof PreviewDecoratorSchema>;
export type PreviewConfig = import("zod").infer<typeof PreviewConfigSchema>;
export type ControlOverride = import("zod").infer<typeof ControlOverrideSchema>;
export type PropExposureOverride = import("zod").infer<typeof PropExposureOverrideSchema>;
export type PropOverride = import("zod").infer<typeof PropOverrideSchema>;
export type ComponentOverride = import("zod").infer<typeof ComponentOverrideSchema>;
export type ComponentsConfig = import("zod").infer<typeof ComponentsConfigSchema>;
export type PromptTemplate = import("zod").infer<typeof PromptTemplateSchema>;
export type AiConfig = import("zod").infer<typeof AiConfigSchema>;
import { z } from 'zod';
