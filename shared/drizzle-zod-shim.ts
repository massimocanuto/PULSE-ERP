import { z } from "zod";

export function createInsertSchema(table: any, refinement?: any) {
    // Return a permissive schema that allows any keys (passhtrough)
    // This bypasses the drizzle-zod crash 'Symbol(drizzle:ViewBaseConfig)'
    // TODO: Revisit this for strict validation later.
    return z.object({}).passthrough();
};

export function createSelectSchema(table: any, refinement?: any) {
    return z.object({}).passthrough();
};
