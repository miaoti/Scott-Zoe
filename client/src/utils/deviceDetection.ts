// Mobile device detection utility
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'mobile'
  ];
  
  const isMobileUserAgent = mobileKeywords.some(keyword => 
    userAgent.includes(keyword)
  );
  
  // Check screen size (mobile-like dimensions) - improved for Edge mobile simulation
  const isMobileScreen = window.innerWidth <= 768 && window.innerHeight <= 1024;
  
  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0;
  
  // Additional check for mobile viewport meta tag behavior
  const hasDevicePixelRatio = window.devicePixelRatio > 1;
  
  // Check for mobile-specific CSS media queries support
  const isMobileMediaQuery = window.matchMedia && 
    window.matchMedia('(max-width: 768px)').matches;
  
  // Enhanced detection for browser mobile simulation modes
  const isSimulatedMobile = isMobileScreen && (isTouchDevice || hasDevicePixelRatio);
  
  // Return true if any mobile indicator is present
  return isMobileUserAgent || isSimulatedMobile || isMobileMediaQuery;
};

// Get mobile-specific window dimensions
export const getMobileWindowDimensions = () => {
  if (typeof window === 'undefined') {
    return { width: 280, height: 400 };
  }
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Mobile window should take most of the screen but leave some margin
  const width = Math.min(viewportWidth - 40, 320); // Max 320px width, 20px margin on each side
  const height = Math.min(viewportHeight - 120, 500); // Max 500px height, leave space for browser UI
  
  return { width, height };
};

// Get mobile-specific window position
export const getMobileWindowPosition = () => {
  if (typeof window === 'undefined') {
    return { x: 20, y: 60 };
  }
  
  const viewportWidth = window.innerWidth;
  const { width } = getMobileWindowDimensions();
  
  // Center horizontally, position near top but below browser UI
  const x = (viewportWidth - width) / 2;
  const y = 60; // Leave space for browser address bar
  
  return { x, y };
};