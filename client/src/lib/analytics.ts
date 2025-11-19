// Google Analytics helper functions

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/**
 * Send event to Google Analytics
 */
export const trackGAEvent = (
  action: string,
  category: string = 'engagement',
  label?: string,
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  try {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } catch (error) {
    console.warn('Failed to track GA event', error);
  }
};

/**
 * Track page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  try {
    window.gtag('config', 'G-R2VQ5P05ZZ', {
      page_path: path,
      page_title: title,
    });
  } catch (error) {
    console.warn('Failed to track page view', error);
  }
};

