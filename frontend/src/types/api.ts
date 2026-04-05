export type UserMe = {
  id: number;
  username: string;
  full_name: string;
  email: string | null;
  is_active: boolean;
  role_codes: string[];
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: UserMe;
};

export type LookupReference = {
  id: number;
  name: string;
  code?: string | null;
  parent_id?: number | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  category_id?: number | null;
  vendor_id?: number | null;
  manufacturer?: string | null;
};

export type UserReference = {
  id: number;
  username: string;
  full_name: string;
};

export type EmployeeReference = {
  id: number;
  employee_code: string;
  full_name: string;
  email: string | null;
};

export type LookupListResponse = {
  items: LookupReference[];
};

export type LookupCreatePayload = {
  code: string;
  name: string;
  parent_id?: number | null;
};

export type VendorCreatePayload = {
  name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
};

export type VendorUpdatePayload = VendorCreatePayload;

export type AssetModelCreatePayload = {
  category_id: number;
  vendor_id?: number | null;
  name: string;
  manufacturer?: string | null;
};

export type AssetModelUpdatePayload = AssetModelCreatePayload;

export type LookupUpdatePayload = LookupCreatePayload;

export type AssetListItem = {
  id: number;
  asset_tag: string;
  name: string;
  serial_number: string | null;
  asset_type: string | null;
  brand: string | null;
  status: LookupReference;
  category: LookupReference;
  location: LookupReference | null;
  assigned_employee: EmployeeReference | null;
  purchase_date: string | null;
  warranty_expiry_date: string | null;
  expected_end_of_life_date: string | null;
  cost_center: string | null;
  location_floor: string | null;
  location_room: string | null;
  location_rack: string | null;
  location_slot: string | null;
};

export type AssetListResponse = {
  items: AssetListItem[];
  total: number;
  page: number;
  page_size: number;
};

export type AssetAssignment = {
  id: number;
  asset_id: number;
  employee: EmployeeReference;
  assigned_by_user: UserReference;
  department: LookupReference | null;
  location: LookupReference | null;
  assigned_at: string;
  expected_return_at: string | null;
  returned_at: string | null;
  notes: string | null;
};

export type AssetEvent = {
  id: number;
  event_type: string;
  summary: string;
  created_at: string;
  performed_by_user: UserReference | null;
  details: Record<string, unknown> | null;
};

export type AssetDocument = {
  id: number;
  asset_id: number;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  uploaded_by_user: UserReference | null;
};

export type AssetDetail = {
  id: number;
  asset_tag: string;
  name: string;
  serial_number: string | null;
  asset_type: string | null;
  brand: string | null;
  description: string | null;
  purchase_date: string | null;
  warranty_expiry_date: string | null;
  expected_end_of_life_date: string | null;
  disposal_date: string | null;
  cost_center: string | null;
  location_floor: string | null;
  location_room: string | null;
  location_rack: string | null;
  location_slot: string | null;
  category: LookupReference;
  model: LookupReference | null;
  status: LookupReference;
  location: LookupReference | null;
  vendor: LookupReference | null;
  current_department: LookupReference | null;
  assigned_employee: EmployeeReference | null;
  assignments: AssetAssignment[];
  events: AssetEvent[];
  documents: AssetDocument[];
  photo_document: AssetDocument | null;
};

export type AssetPayload = {
  asset_tag?: string;
  name: string;
  category_id: number;
  status_id: number;
  serial_number?: string | null;
  asset_type?: string | null;
  brand?: string | null;
  model_id?: number | null;
  location_id?: number | null;
  vendor_id?: number | null;
  current_department_id?: number | null;
  description?: string | null;
  purchase_date?: string | null;
  warranty_expiry_date?: string | null;
  expected_end_of_life_date?: string | null;
  disposal_date?: string | null;
  cost_center?: string | null;
  location_floor?: string | null;
  location_room?: string | null;
  location_rack?: string | null;
  location_slot?: string | null;
};

export type AssetStatusChangePayload = {
  status_id: number;
  notes?: string | null;
};

export type AssetLocationChangePayload = {
  location_id: number | null;
  notes?: string | null;
};

export type AssetAssignPayload = {
  employee_id: number;
  department_id?: number | null;
  location_id?: number | null;
  expected_return_at?: string | null;
  notes?: string | null;
};

export type AssetReturnPayload = {
  notes?: string | null;
};

export type MaintenanceTicket = {
  id: number;
  asset: LookupReference;
  vendor: LookupReference | null;
  opened_by_user: UserReference | null;
  status: string;
  title: string;
  description: string | null;
  opened_at: string;
  closed_at: string | null;
};

export type MaintenanceTicketListResponse = {
  items: MaintenanceTicket[];
  total: number;
  page: number;
  page_size: number;
};

export type MaintenanceTicketPayload = {
  asset_id: number;
  vendor_id?: number | null;
  title: string;
  description?: string | null;
};

export type MaintenanceTicketUpdatePayload = {
  vendor_id?: number | null;
  title: string;
  description?: string | null;
};

export type SoftwareLicenseAssignment = {
  id: number;
  software_license_id: number;
  user: UserReference | null;
  asset: LookupReference | null;
  assigned_by_user: UserReference;
  assigned_at: string;
  revoked_at: string | null;
  notes: string | null;
};

export type SoftwareLicenseEvent = {
  id: number;
  event_type: string;
  summary: string;
  created_at: string;
  performed_by_user: UserReference | null;
  details: Record<string, unknown> | null;
};

export type SoftwareLicenseListItem = {
  id: number;
  product_name: string;
  license_type: string;
  purchased_quantity: number;
  active_assignments: number;
  available_quantity: number;
  expiry_date: string | null;
  vendor: LookupReference | null;
};

export type SoftwareLicenseDetail = SoftwareLicenseListItem & {
  purchase_date: string | null;
  renewal_alert_days: number;
  notes: string | null;
  assignments: SoftwareLicenseAssignment[];
  events: SoftwareLicenseEvent[];
};

export type SoftwareLicenseListResponse = {
  items: SoftwareLicenseListItem[];
};

export type SoftwareLicensePayload = {
  product_name: string;
  vendor_id?: number | null;
  license_type: string;
  purchased_quantity: number;
  purchase_date?: string | null;
  expiry_date?: string | null;
  renewal_alert_days?: number;
  notes?: string | null;
};

export type SoftwareLicenseAssignPayload = {
  user_id?: number | null;
  asset_id?: number | null;
  notes?: string | null;
};

export type SoftwareLicenseRevokePayload = {
  notes?: string | null;
};

export type UserListItem = {
  id: number;
  username: string;
  full_name: string;
  email: string | null;
  department_id: number | null;
  is_active?: boolean;
  role_codes: string[];
};

export type UserListResponse = {
  items: UserListItem[];
  total: number;
  page: number;
  page_size: number;
};

export type EmployeeListItem = {
  id: number;
  employee_code: string;
  full_name: string;
  email: string | null;
  department_id: number | null;
  is_active: boolean;
  notes: string | null;
};

export type EmployeeListResponse = {
  items: EmployeeListItem[];
  total: number;
  page: number;
  page_size: number;
};

export type EmployeePayload = {
  employee_code: string;
  full_name: string;
  email?: string | null;
  department_id?: number | null;
  is_active: boolean;
  notes?: string | null;
};

export type UserPayload = {
  department_id?: number | null;
  username?: string;
  full_name: string;
  email?: string | null;
  password?: string | null;
  is_active: boolean;
  role_codes: string[];
};

export type DashboardSummary = {
  total_assets: number;
  assigned_assets: number;
  assets_in_maintenance: number;
  open_maintenance_tickets: number;
  warranties_expiring_soon: number;
  end_of_life_soon: number;
  assignments_due_soon: number;
  overdue_assignments: number;
  total_notifications: number;
  assets_by_status: Array<{
    status_id: number;
    status_code: string;
    status_name: string;
    total: number;
  }>;
  recent_assets: Array<{
    id: number;
    asset_tag: string;
    name: string;
    status_code: string;
    status_name: string;
    warranty_expiry_date: string | null;
    expected_end_of_life_date: string | null;
  }>;
  recent_open_tickets: Array<{
    id: number;
    title: string;
    status: string;
    asset_id: number;
    asset_name: string;
    asset_tag: string;
  }>;
  lifecycle_alerts: Array<{
    asset_id: number;
    asset_tag: string;
    asset_name: string;
    due_date: string;
    alert_type: string;
    days_remaining: number;
  }>;
  assignment_alerts: Array<{
    asset_id: number;
    asset_tag: string;
    asset_name: string;
    assigned_employee_name: string;
    expected_return_at: string;
    days_remaining: number;
    alert_type: string;
  }>;
  notifications: Array<{
    title: string;
    body: string;
    severity: string;
    link: string;
    category: string;
  }>;
  assets_ready_for_assignment: Array<{
    asset_id: number;
    asset_tag: string;
    asset_name: string;
    status_code: string;
    status_name: string;
    location_name: string | null;
    assigned_employee_name: string | null;
  }>;
  retired_assets_pending_disposal: Array<{
    asset_id: number;
    asset_tag: string;
    asset_name: string;
    status_code: string;
    status_name: string;
    location_name: string | null;
    assigned_employee_name: string | null;
  }>;
  maintenance_queue: Array<{
    ticket_id: number;
    title: string;
    status: string;
    asset_id: number;
    asset_tag: string;
    asset_name: string;
    opened_at: string;
    opened_days: number;
  }>;
};

export type UserPreferences = {
  user_id: number;
  language: string;
  timezone: string;
  date_format: "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";
  table_density: "compact" | "comfortable";
  default_page_size: number;
};

export type UserPreferencesPayload = Partial<{
  language: string;
  timezone: string;
  date_format: "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";
  table_density: "compact" | "comfortable";
  default_page_size: number;
}>;

export type AppSettings = {
  org_name: string;
  default_asset_status_on_create_id: number;
  max_document_size_mb: number;
  allowed_document_mime_types: string[];
  updated_by_user_id: number | null;
  updated_at: string | null;
};

export type AppSettingsPayload = Partial<{
  org_name: string;
  default_asset_status_on_create_id: number;
  max_document_size_mb: number;
  allowed_document_mime_types: string[];
}>;
