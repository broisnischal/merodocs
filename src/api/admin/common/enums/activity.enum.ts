const activityEnum = {
  dashboard: ['dashboard'],
  'society_check_in/out_log': [],
  residents: ['resident'],
  residential_staffs: ['residential_staff'],
  amenities: [],
  approval_requests: [],
  community_updates: [],
  maintenance_requests: [],
  society_gallery: [],
  document_center: [],
  emergency_alerts: [],
  apartment_details: ['gate', 'apartment'],
  community_staffs: [
    'adminuser',
    'guarduser',
    'serviceuser',
    'role',
    'permission',
  ],
  settings: [],
} as const;

type ActivityEnumType = typeof activityEnum;

export type Action = ActivityEnumType[keyof ActivityEnumType];

export type ActivityType = keyof ActivityEnumType;

export enum ActivityEnum {
  dashboard = 'dashboard',
  'society_check_in/out_log' = 'society_check_in/out_log',
  residents = 'residents',
  residential_staffs = 'residential_staffs',
  amenities = 'amenities',
  approval_requests = 'approval_requests',
  community_updates = 'community_updates',
  maintenance_requests = 'maintenance_requests',
  society_gallery = 'society_gallery',
  document_center = 'document_center',
  emergency_alerts = 'emergency_alerts',
  apartment_details = 'apartment_details',
  community_staffs = 'community_staffs',
  settings = 'settings',
}
