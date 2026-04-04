import { apiRequest } from "./http";
import type { EmployeeListItem, EmployeeListResponse, EmployeePayload } from "../types/api";

export function getEmployees() {
  return apiRequest<EmployeeListResponse>("/employees");
}

export function getEmployee(employeeId: number) {
  return apiRequest<EmployeeListItem>(`/employees/${employeeId}`);
}

export function createEmployee(payload: EmployeePayload) {
  return apiRequest<EmployeeListItem>("/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEmployee(employeeId: number, payload: EmployeePayload) {
  return apiRequest<EmployeeListItem>(`/employees/${employeeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
