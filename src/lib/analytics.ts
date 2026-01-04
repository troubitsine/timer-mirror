/**
 * Where: src/lib/analytics.ts
 * What: Wrapper around Vercel Analytics track() with shared event names + payload sanitization.
 * Why: Keep analytics usage consistent and enforce custom event constraints in one place.
 */
import { track } from "@vercel/analytics";
import { isMobileDevice } from "@/lib/deviceDetection";

const MAX_EVENT_VALUE_LENGTH = 255;

type Primitive = string | number | boolean | null;

export type AnalyticsPayload = Record<string, Primitive | undefined>;

export const ANALYTICS_EVENTS = {
  TASK_NAME_BLUR: "input_task_name_blur",
  TASK_NAME_START: "input_task_name_start",
  TIMER_DURATION_PRESET: "click_duration_preset",
  TIMER_DURATION_SLIDER: "input_duration_slider",
  TIMER_START_CLICK: "click_start_session",
  TIMER_SESSION_START: "session_start",
  CAMERA_PERMISSION_REQUEST: "permission_camera_request",
  CAMERA_PERMISSION_GRANTED: "permission_camera_granted",
  CAMERA_PERMISSION_DENIED: "permission_camera_denied",
  CAMERA_PERMISSION_ERROR: "permission_camera_error",
  PIP_OPEN: "click_pip_open",
  PIP_VARIANT_TOGGLE: "toggle_pip_variant",
  SECRET_END_SESSION: "click_end_session_secret",
  SECRET_ONE_MINUTE: "click_set_one_minute",
  ONBOARDING_DIALOG_TOGGLE: "toggle_onboarding_dialog",
  ONBOARDING_STEP_SELECT: "click_onboarding_step",
  ONBOARDING_NEXT: "click_onboarding_next",
  ONBOARDING_SKIP: "click_onboarding_skip",
  ONBOARDING_GET_STARTED: "click_onboarding_get_started",
  ONBOARDING_CARD_TOGGLE: "toggle_onboarding_card",
  SESSION_COMPLETE: "session_complete",
  SESSION_VIEW_CHANGE: "toggle_session_view",
  SESSION_START_NEW: "click_start_new_timer",
  SHARE_BUTTON_CLICK: "click_share_button",
  SHARE_DOWNLOAD: "click_share_download",
  SHARE_ATTEMPT: "share_attempt",
  SHARE_SUCCESS: "share_success",
  SHARE_CANCEL: "share_cancel",
  SHARE_FAILURE: "share_failure",
  SHARE_FALLBACK_OPEN: "share_fallback_open",
  SHARE_ASPECT_RATIO: "toggle_share_aspect",
  SHARE_VIEW_MODE: "toggle_share_view",
  BACKGROUND_SELECT: "select_background",
  SESSION_REPLAY: "click_replay_montage",
  SHARE_REPLAY: "click_replay_share_montage",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

interface TrackEventOptions {
  surface?: string;
  includeRoute?: boolean;
  includeDevice?: boolean;
}

const normalizeString = (value: string) =>
  value.length > MAX_EVENT_VALUE_LENGTH
    ? value.slice(0, MAX_EVENT_VALUE_LENGTH)
    : value;

const sanitizeValue = (value: unknown): Primitive | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string") return normalizeString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  return undefined;
};

const buildContext = (options?: TrackEventOptions): Record<string, Primitive> => {
  const data: Record<string, Primitive> = {};
  const includeRoute = options?.includeRoute ?? true;
  const includeDevice = options?.includeDevice ?? true;

  if (options?.surface) {
    data.surface = normalizeString(options.surface);
  }

  if (includeRoute && typeof window !== "undefined") {
    data.route = normalizeString(window.location.pathname || "");
  }

  if (includeDevice && typeof window !== "undefined") {
    data.isMobile = isMobileDevice();
  }

  return data;
};

const sanitizePayload = (payload: Record<string, unknown>) => {
  const sanitized: Record<string, Primitive> = {};
  Object.entries(payload).forEach(([key, value]) => {
    const safeValue = sanitizeValue(value);
    if (safeValue === undefined) return;

    const safeKey = normalizeString(key);
    if (!safeKey) return;

    sanitized[safeKey] = safeValue;
  });

  return sanitized;
};

export const ANALYTICS_LIMITS = {
  maxStringLength: MAX_EVENT_VALUE_LENGTH,
} as const;

export function trackEvent(
  name: AnalyticsEventName | string,
  data?: AnalyticsPayload,
  options?: TrackEventOptions,
) {
  const safeName = normalizeString(name);
  const merged = {
    ...buildContext(options),
    ...(data ?? {}),
  };
  const sanitized = sanitizePayload(merged);

  if (Object.keys(sanitized).length === 0) {
    track(safeName);
    return;
  }

  track(safeName, sanitized);
}
