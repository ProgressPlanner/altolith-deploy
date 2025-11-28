/**
 * Profiles Module
 *
 * Exports profile registries, hooks, and components.
 */

// Registries
export { default as ProfileTypeRegistry } from './ProfileTypeRegistry';
export { default as ProfileRegistry } from './ProfileRegistry';

// Hooks
export { useProfiles } from './hooks/useProfiles';
export { useProfileTypes } from './hooks/useProfileTypes';

// Components
export { default as ProfileSelector } from './components/ProfileSelector';
export { default as ProfileForm } from './components/ProfileForm';
