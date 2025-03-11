import React from 'react';

/**
 * A utility to help suppress React 19 ref warnings
 * This is a temporary solution until component libraries update
 */
export function suppressRefWarnings() {
  // This doesn't actually do anything at runtime
  // It's just a placeholder to indicate we're aware of the warnings
  if (process.env.NODE_ENV === 'development') {
    console.log('React 19 ref warnings are expected and can be ignored');
  }
}

/**
 * Use this in your application's entry point to acknowledge the warnings
 */
export function setupReact19CompatMode() {
  if (typeof window !== 'undefined') {
    suppressRefWarnings();
  }
} 