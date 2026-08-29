import type { UserRole } from "@/types/database";

export interface NavItem {
  label: string;
  href?: string;
  requiresAuth?: boolean;
  publicOnly?: boolean;
  isDashboard?: boolean; // Special flag: href is resolved dynamically based on user role
  allowedRoles?: UserRole[]; // If set, only users with one of these roles can see it
  children?: NavItem[];
}

/** Returns the correct dashboard path for a given user role */
export function getDashboardPath(role: UserRole | null | undefined): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "DEPT_ADMIN":
      return "/department-admin";
    case "OFFICER":
      return "/officer";
    case "CITIZEN":
    default:
      return "/citizen";
  }
}

export const navigationConfig: NavItem[] = [
  {
    label: "Dashboard",
    href: "/citizen", // fallback; overridden dynamically by isDashboard
    isDashboard: true,
    requiresAuth: true,
  },
  {
    label: "Grievance",
    requiresAuth: true,
    children: [
      {
        label: "Submit New",
        href: "/grievances/new",
        requiresAuth: true,
        allowedRoles: ["CITIZEN"],
      },
      {
        label: "Track a Grievance",
        href: "/track",
        requiresAuth: true,
        allowedRoles: ["CITIZEN"],
      },
      {
        label: "My Grievances",
        href: "/grievances",
        requiresAuth: true,
        allowedRoles: ["CITIZEN"],
      },
    ],
  },
  {
    label: "Department",
    requiresAuth: true,
    allowedRoles: ["DEPT_ADMIN", "SUPER_ADMIN"],
    children: [
      {
        label: "All Grievances",
        href: "/department-admin/grievances",
        requiresAuth: true,
        allowedRoles: ["DEPT_ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Analytics",
        href: "/department-admin/analytics",
        requiresAuth: true,
        allowedRoles: ["DEPT_ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Manage Officers",
        href: "/department-admin/officers",
        requiresAuth: true,
        allowedRoles: ["DEPT_ADMIN", "SUPER_ADMIN"],
      }
    ]
  },
  {
    label: "Administration",
    requiresAuth: true,
    allowedRoles: ["SUPER_ADMIN"],
    children: [
      {
        label: "Overview",
        href: "/admin",
        requiresAuth: true,
        allowedRoles: ["SUPER_ADMIN"],
      },
      {
        label: "Users",
        href: "/admin/users",
        requiresAuth: true,
        allowedRoles: ["SUPER_ADMIN"],
      },
      {
        label: "Departments",
        href: "/admin/departments",
        requiresAuth: true,
        allowedRoles: ["SUPER_ADMIN"],
      },
      {
        label: "Categories",
        href: "/admin/categories",
        requiresAuth: true,
        allowedRoles: ["SUPER_ADMIN"],
      },
      {
        label: "SLA Rules",
        href: "/admin/sla-rules",
        requiresAuth: true,
        allowedRoles: ["SUPER_ADMIN"],
      },
      {
        label: "Services",
        href: "/admin/services",
        requiresAuth: true,
        allowedRoles: ["SUPER_ADMIN"],
      },
      {
        label: "Audit Logs",
        href: "/admin/audit-logs",
        requiresAuth: true,
        allowedRoles: ["SUPER_ADMIN"],
      },
      {
        label: "Settings",
        href: "/admin/settings",
        requiresAuth: true,
        allowedRoles: ["SUPER_ADMIN"],
      },
    ]
  },
  {
    label: "Live Map",
    href: "/map",
    requiresAuth: false,
  },
  {
    label: "About Us",
    href: "/about",
  },
  {
    label: "Services",
    href: "/services",
  },
  {
    label: "Appeals",
    href: "/appeals",
    requiresAuth: true,
  },
];
