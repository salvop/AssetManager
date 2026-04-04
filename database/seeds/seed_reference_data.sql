INSERT INTO roles (id, code, name)
VALUES
  (1, 'ADMIN', 'Administrator'),
  (2, 'ASSET_MANAGER', 'Asset Manager'),
  (3, 'OPERATOR', 'Operator'),
  (4, 'VIEWER', 'Viewer')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO departments (id, code, name, is_active)
VALUES
  (1, 'IT', 'Information Technology', 1),
  (2, 'HR', 'Human Resources', 1),
  (3, 'FIN', 'Finance', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active);

INSERT INTO locations (id, code, name)
VALUES
  (1, 'HQ', 'Headquarters'),
  (2, 'HQ-IT', 'Headquarters - IT Storage'),
  (3, 'BR1', 'Branch Office 1')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO asset_categories (id, code, name)
VALUES
  (1, 'LAPTOP', 'Laptop'),
  (2, 'DESKTOP', 'Desktop'),
  (3, 'MONITOR', 'Monitor'),
  (4, 'PHONE', 'Phone'),
  (5, 'PRINTER', 'Printer'),
  (6, 'SERVER', 'Server')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO asset_statuses (id, code, name, is_assignable)
VALUES
  (1, 'IN_STOCK', 'In Stock', 1),
  (2, 'ASSIGNED', 'Assigned', 1),
  (3, 'MAINTENANCE', 'Maintenance', 0),
  (4, 'RETIRED', 'Retired', 0),
  (5, 'DISPOSED', 'Disposed', 0)
ON DUPLICATE KEY UPDATE name = VALUES(name), is_assignable = VALUES(is_assignable);
