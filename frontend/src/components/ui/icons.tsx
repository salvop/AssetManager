import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </BaseIcon>
  );
}

export function AssetIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 8 12 4l8 4-8 4-8-4Z" />
      <path d="M4 12 12 16l8-4" />
      <path d="M4 16 12 20l8-4" />
    </BaseIcon>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 18a5.5 5.5 0 0 1 11 0" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M15 18a4.5 4.5 0 0 1 6 0" />
    </BaseIcon>
  );
}

export function LicenseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </BaseIcon>
  );
}

export function MaintenanceIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m14.5 5.5 4 4" />
      <path d="m3 21 6.5-6.5" />
      <path d="M13 7a4 4 0 0 0-5.7 5.6L5 14.9a2.1 2.1 0 1 0 3 3l2.3-2.3A4 4 0 0 0 16 10l3.5-3.5a1.4 1.4 0 0 0-2-2L14 8" />
    </BaseIcon>
  );
}

export function PreferencesIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 6h10M4 12h16M4 18h12" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="9" cy="18" r="2" />
      <circle cx="13" cy="12" r="2" />
    </BaseIcon>
  );
}

export function LookupIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M9 10v10M15 10v10" />
    </BaseIcon>
  );
}

export function UsersAdminIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="8.5" cy="8.5" r="2.8" />
      <path d="M3.5 19a5 5 0 0 1 10 0" />
      <circle cx="17.5" cy="8.5" r="2.8" />
      <path d="M14.5 19a5 5 0 0 1 6 0" />
    </BaseIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1l-.4-2.6H9.6l-.4 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 2.6h4.8l.4-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" />
    </BaseIcon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14M5 12h14" />
    </BaseIcon>
  );
}
