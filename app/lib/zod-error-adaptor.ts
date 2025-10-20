import * as z from "zod";

export type ZodErrorAdapterOut = {
  /** Top-level (form) errors, e.g. cross-field refinements */
  formErrors: string[];
  /** First error per field path (dot-notation), ideal for inline UI */
  fieldErrors: Record<string, string>;
  /** All errors per field path (dot-notation), if you want to show multiple */
  fieldErrorsAll: Record<string, string[]>;
};

/**
 * Convert a ZodError to UI-friendly maps.
 * - Uses z.flattenError() for shallow schemas when possible
 * - Uses z.treeifyError() to preserve & traverse nested structure
 * - Falls back to error.issues for full dot-path mapping
 */
export function adaptZodError(error: z.ZodError<any>): ZodErrorAdapterOut {
  // 1) Try the shallow, official v4 helper (great for 1-level forms)
  //    Docs: https://zod.dev/error-formatting
  try {
    const flat = (z as any).flattenError?.(error) as
      | { errors: string[]; properties?: Record<string, string[]> }
      | undefined;

    if (flat && flat.properties) {
      const formErrors = Array.isArray(flat.errors) ? flat.errors : [];
      const fieldErrorsAll: Record<string, string[]> = {};
      for (const [k, arr] of Object.entries(flat.properties)) {
        fieldErrorsAll[k] = arr ?? [];
      }
      return {
        formErrors,
        fieldErrors: firsts(fieldErrorsAll),
        fieldErrorsAll,
      };
    }
  } catch {
    // ignore; we’ll try treeify next
  }

  // 2) Use treeify for nested schemas (objects/arrays)
  //    Docs: https://zod.dev/v4/changelog  (flatten()/format() deprecated → treeifyError)
  try {
    const tree = (z as any).treeifyError?.(error) as
      | {
          errors?: string[];
          properties?: Record<string, any>;
          items?: Record<string, any> | any[];
        }
      | undefined;

    if (tree) {
      const formErrors = tree.errors ?? [];
      const fieldErrorsAll: Record<string, string[]> = {};
      // Walk the tree and collect dot-paths
      walkTree(tree, "", fieldErrorsAll);
      return {
        formErrors,
        fieldErrors: firsts(fieldErrorsAll),
        fieldErrorsAll,
      };
    }
  } catch {
    // ignore; we’ll fall back to issues
  }

  // 3) Final fallback: construct from raw issues (always available)
  const fieldErrorsAll: Record<string, string[]> = {};
  const formErrors: string[] = [];

  for (const issue of error.issues) {
    const path = issue.path?.length ? issue.path.join(".") : "";
    if (!path) {
      formErrors.push(issue.message);
      continue;
    }
    if (!fieldErrorsAll[path]) fieldErrorsAll[path] = [];
    fieldErrorsAll[path].push(issue.message);
  }

  return {
    formErrors,
    fieldErrors: firsts(fieldErrorsAll),
    fieldErrorsAll,
  };
}

/* -------------------- helpers -------------------- */

function firsts(all: Record<string, string[]>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, arr] of Object.entries(all)) if (arr?.length) out[k] = arr[0];
  return out;
}

/**
 * Depth-first traversal over tree from z.treeifyError()
 * Accumulates errors at leaf nodes into dot-notation paths.
 */
function walkTree(
  node: any,
  prefix: string,
  sink: Record<string, string[]>
) {
  // collect leaf errors at this node (if any and has a path name)
  if (node?.errors?.length && prefix) {
    if (!sink[prefix]) sink[prefix] = [];
    sink[prefix].push(...node.errors);
  }

  // object properties: { properties: { key: subtree } }
  if (node?.properties && typeof node.properties === "object") {
    for (const [key, child] of Object.entries<any>(node.properties)) {
      const next = prefix ? `${prefix}.${key}` : key;
      walkTree(child, next, sink);
    }
  }

  // array items: { items: Array | Record<number, subtree> }
  if (node?.items) {
    const items = node.items;
    if (Array.isArray(items)) {
      items.forEach((child, index) =>
        walkTree(child, `${prefix}[${index}]`, sink)
      );
    } else if (typeof items === "object") {
      for (const [k, child] of Object.entries<any>(items)) {
        const idx = /^\d+$/.test(k) ? Number(k) : k;
        const next =
          typeof idx === "number" ? `${prefix}[${idx}]` : `${prefix}.${idx}`;
        walkTree(child, next, sink);
      }
    }
  }
}
