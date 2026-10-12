/**
 * Advanced Device Fingerprinting & Multi-Entropy Hardware Locking
 * Ensures a physical browser/phone is strictly restricted to a single submission per attendance session.
 * 
 * Guards against:
 * 1. Clearing localStorage / cookies
 * 2. Opening Incognito / Private tabs on the same phone
 * 3. Script-injected spoofed UUIDs
 */

const STORAGE_KEY = 'unipass_device_id';
const SESSION_KEY = 'unipass_session_device_id';

// Simple string hash (FNV-1a 32-bit algorithm)
function fnv1a(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Generates an invisible off-screen canvas fingerprint based on GPU rendering nuances
 */
function getCanvasFingerprint(): string {
  if (typeof document === 'undefined') return 'server_canvas';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no_2d_ctx';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', sans-serif";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('UniPass-NG-Secured:🎓', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('UniPass-NG-Secured:🎓', 4, 17);

    return fnv1a(canvas.toDataURL());
  } catch {
    return 'canvas_error';
  }
}

/**
 * Extracts WebGL GPU renderer & vendor (unmasked debug info)
 */
function getWebGLFingerprint(): string {
  if (typeof document === 'undefined') return 'server_webgl';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return 'no_webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      return fnv1a(`${vendor}~${renderer}`);
    }
    return fnv1a(gl.getParameter(gl.RENDERER) || 'unknown_renderer');
  } catch {
    return 'webgl_error';
  }
}

/**
 * Generates a stable hardware fingerprint that remains identical even if:
 * - Student opens Incognito mode
 * - Student clears localStorage
 * - Student uses private browser windows on the same physical phone
 */
export function getHardwareFingerprint(): string {
  if (typeof window === 'undefined') return 'hw_server';

  const screenRes = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth || 24}`;
  const pixelRatio = window.devicePixelRatio || 1;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;
  const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
  const canvasHash = getCanvasFingerprint();
  const webglHash = getWebGLFingerprint();
  const platform = navigator.platform || 'Unknown';

  const rawEntropy = [
    screenRes,
    pixelRatio,
    cores,
    mem,
    timezone,
    canvasHash,
    webglHash,
    platform,
  ].join('|');

  return 'hw_' + fnv1a(rawEntropy);
}

/**
 * Retrieves or creates a persistent device UUID
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'dev_server';

  try {
    // 1. Check localStorage
    const localId = localStorage.getItem(STORAGE_KEY);
    if (localId && localId.length >= 16) {
      return localId;
    }

    // 2. Check sessionStorage
    const sessionId = sessionStorage.getItem(SESSION_KEY);
    if (sessionId && sessionId.length >= 16) {
      try {
        localStorage.setItem(STORAGE_KEY, sessionId);
      } catch { /* ignore */ }
      return sessionId;
    }
  } catch {
    // Storage read blocked
  }

  // Generate a cryptographically strong UUID
  let uuid = '';
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    uuid = crypto.randomUUID();
  } else {
    uuid = 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
  }

  try {
    localStorage.setItem(STORAGE_KEY, uuid);
    sessionStorage.setItem(SESSION_KEY, uuid);
  } catch {
    // Storage write error
  }

  return uuid;
}

/**
 * Comprehensive device security payload sent with attendance submissions
 */
export function getDeviceSecurityPayload() {
  const deviceId = getOrCreateDeviceId();
  const hardwareHash = getHardwareFingerprint();
  const deviceInfo = getDeviceSummary();

  return {
    deviceId,
    hardwareHash,
    deviceInfo,
  };
}

export function getDeviceSummary(): string {
  if (typeof window === 'undefined') return 'Server Runtime';
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (/Android/i.test(ua)) os = 'Android Mobile';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'Apple iOS';
  else if (/Windows/i.test(ua)) os = 'Windows PC';
  else if (/Mac/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Chrome/i.test(ua) && !/Edge|Edg|OPR/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edge|Edg/i.test(ua)) browser = 'Edge';

  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : '';
  return `${browser} on ${os} (${screenRes}${cores ? ', ' + cores : ''})`;
}
