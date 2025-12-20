/**
 * Payload CMS Collections - Index Export
 * All collections used by the admin panel
 */

// Core content collections
export { Categories } from './Categories';
export { Subcategories } from './Subcategories';
export { Tags } from './Tags';
export { Resources } from './Resources';

// Resource discovery and administration
export { ResourceSources } from './ResourceSources';
export { ResourceDiscoveryQueue } from './ResourceDiscoveryQueue';
export { AuditLogs } from './AuditLogs';

// Documentation cross-linking
export { Documents } from './Documents';
export { DocumentSections } from './DocumentSections';
export { CodeExamples } from './CodeExamples';

// Reference data collections (lookups)
export { DifficultyLevels } from './DifficultyLevels';
export { ProgrammingLanguages } from './ProgrammingLanguages';

// User management
export { Users, hasRole } from './Users';
export type { UserRole } from './Users';

// Moderation
export { EditSuggestions } from './EditSuggestions';
export { ResourceReviews } from './ResourceReviews';
export { ResourceAuthors } from './ResourceAuthors';

// Media uploads
export { Media } from './Media';

// Internationalization
export { Translations } from './Translations';

// Email Management
export { EmailTemplates } from './EmailTemplates';

// Gamification
export { AchievementTiers } from './AchievementTiers';
export { AchievementCategories } from './AchievementCategories';
export { Achievements } from './Achievements';
export { Badges } from './Badges';
