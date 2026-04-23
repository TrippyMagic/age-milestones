import type { Range } from "../../utils/scaleTransform";

export type Timeline3DQualityProfile = "balanced" | "low-power";

export type Timeline3DQualityProfileInput = {
  isMobile: boolean;
  prefersReducedMotion: boolean;
};

export type Timeline3DAvailability = {
  supported: boolean;
  fallbackMessage: string;
};

export type Timeline3DToggleState = {
  disabled: boolean;
  label: string;
  title: string;
};

export type Timeline3DProfileConfig = {
  qualityProfile: Timeline3DQualityProfile;
  containerClassName: string;
  headerHint: string;
  camera: {
    position: [number, number, number];
    fov: number;
  };
  dpr: [number, number];
  stars: {
    radius: number;
    depth: number;
    count: number;
    factor: number;
  };
  lighting: {
    ambientIntensity: number;
    directionalIntensity: number;
    pointIntensity: number;
  };
  orbitControls: {
    dampingFactor: number;
    minDistance: number;
    maxDistance: number;
    maxPolarAngle: number;
  };
  gl: {
    antialias: boolean;
    alpha: boolean;
    powerPreference: "high-performance" | "low-power";
  };
  performanceMin: number;
};

export const resolveTimeline3DQualityProfile = ({
  isMobile,
  prefersReducedMotion,
}: Timeline3DQualityProfileInput): Timeline3DQualityProfile =>
  isMobile || prefersReducedMotion ? "low-power" : "balanced";

export const resolveTimeline3DAvailability = (webglSupported: boolean): Timeline3DAvailability => ({
  supported: webglSupported,
  fallbackMessage: webglSupported
    ? ""
    : "⚠️ WebGL is not available in this browser. The 3D timeline requires WebGL to render.",
});

export const resolveTimeline3DToggleState = ({
  availability,
  show3D,
}: {
  availability: Timeline3DAvailability;
  show3D: boolean;
}): Timeline3DToggleState => {
  if (!availability.supported) {
    return {
      disabled: true,
      label: "Open experimental 3D",
      title: "WebGL is not supported in this browser",
    };
  }

  return show3D
    ? {
        disabled: false,
        label: "Exit experimental 3D",
        title: "Leave the experimental 3D scene",
      }
    : {
        disabled: false,
        label: "Open experimental 3D",
        title: "Open the experimental 3D scene",
      };
};

export const getTimeline3DProfileConfig = (
  qualityProfile: Timeline3DQualityProfile,
): Timeline3DProfileConfig => qualityProfile === "low-power"
  ? {
      qualityProfile,
      containerClassName: "timeline-3d timeline-3d--low-power",
      headerHint: "Experimental 3D · low power mode",
      camera: { position: [0, 3.9, 18], fov: 58 },
      dpr: [1, 1.15],
      stars: { radius: 72, depth: 42, count: 900, factor: 3 },
      lighting: {
        ambientIntensity: 0.4,
        directionalIntensity: 0.7,
        pointIntensity: 0.28,
      },
      orbitControls: {
        dampingFactor: 0.08,
        minDistance: 6,
        maxDistance: 26,
        maxPolarAngle: Math.PI * 0.78,
      },
      gl: {
        antialias: false,
        alpha: false,
        powerPreference: "low-power",
      },
      performanceMin: 0.35,
    }
  : {
      qualityProfile,
      containerClassName: "timeline-3d",
      headerHint: "Drag to orbit · Scroll to zoom",
      camera: { position: [0, 4.5, 16], fov: 55 },
      dpr: [1, 1.75],
      stars: { radius: 90, depth: 55, count: 2200, factor: 4 },
      lighting: {
        ambientIntensity: 0.32,
        directionalIntensity: 0.9,
        pointIntensity: 0.4,
      },
      orbitControls: {
        dampingFactor: 0.1,
        minDistance: 5,
        maxDistance: 30,
        maxPolarAngle: Math.PI * 0.78,
      },
      gl: {
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      },
      performanceMin: 0.5,
    };

export const isTimeline3DRangeRenderable = (range: Range): boolean => range.end > range.start;

