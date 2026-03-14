/**
 * src/utils/webgl.ts
 * WebGL availability detection — evaluated once at module load time.
 * Kept in a separate file so it can be imported by both the 3D wrapper
 * and the Milestones toggle button without violating the
 * react-refresh/only-export-components ESLint rule.
 */

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

/** True if the browser supports WebGL (checked once at module initialisation). */
export const WEB_GL_SUPPORTED: boolean = detectWebGL();

