import { apiRequest } from "./http";
import type { EmployeeListItem, EmployeeListResponse, EmployeePayload } from "../types/api";

type EmployeeListParams = {
  page?: number;
  pageSize?: number;
};

export function getEmployees(params: EmployeeListParams = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("page_size", String(params.pageSize ?? 100));
  return apiRequest<EmployeeListResponse>(`/employees?${searchParams.toString()}`);
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
