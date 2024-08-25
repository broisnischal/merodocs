// !extremly cautious while changing this file, it may break the application
type RoutePermissionType = {
  [key: string]: readonly string[];
};

export const RoutePermission: RoutePermissionType = {
  dashboard: ['dashboard'],
  'society_check_in/out_log': ['checkinout'],
  residents: ['resident'],
  residential_staffs: ['residential_staff'],
  amenities: ['amenity'],
  approval_requests: ['apartmentclientuser'],
  'notices_/_polls': ['notice', 'poll'],
  maintenance_requests: ['maintenance', 'comment'],
  society_gallery: ['gallery'],
  document_center: ['document', 'document_type'],
  emergency_alerts: ['alert'],
  apartment_details: ['surveillance', 'apartment', 'block', 'floor', 'flat'],
  society_staffs: [
    'adminuser',
    'guarduser',
    'servicerole',
    'serviceuser',
    'role',
    'permission',
    'guardshift',
    'adminshift',
    'serviceshift',
  ],
  settings: ['problem', 'feedback', 'notification', 'color'],
  ad_banner: ['popup'],
};

export const RoutePermissionCollection: readonly string[] =
  Object.keys(RoutePermission);
