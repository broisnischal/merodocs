// !extremly cautious while changing this file, it may break the application
export const superAdminPermissions = {
  dashboard: [
    'total-clients',
    'total-revenues',
    'expiring-soon',
    'new-clients',
  ],
  clients: ['profile', 'subscription', 'verification-documents'],
  settings: ['document-type', 'user', 'role', 'color'],
  // 'reports-feedback': ['feedback', 'report',],
  'reports-feedback': ['feedback', 'society-report', 'client-report'],
  'ad-banner': ['popupbanner'],
  websites: [
    'home',
    'resident',
    'guard',
    'management',
    'about_us',
    'faqs',
    'contact_us',
    'videos',
    'legal_&_compliance',
  ],
  blogs: ['category', 'tag', 'overview'],
};

export const superadminPermissionNames = Object.keys(superAdminPermissions);
// 1ad281b2-31cd-4771-a478-04a324613c2a - ad-push -> ad-banner
