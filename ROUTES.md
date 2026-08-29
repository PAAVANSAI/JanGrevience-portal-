# JanGrievance Application Routes

Here is a comprehensive list of all the web routes (pages) and API endpoints available in the Next.js application, organized by their core function.

## 🏠 Public & Core Routes
These routes are accessible without logging in, or serve as the entry points to the application.
- `/` - The landing page of the JanGrievance platform.
- `/track` - A public route where citizens can track the status of a specific Grievance ID without logging in (if configured for public access).

## 🔐 Authentication Routes
Handled under the Next.js `(auth)` group, these pages manage user sign-ups and sessions.
- `/login` - User login page.
- `/register` - Citizen account registration.
- `/forgot-password` - Request a password reset link.
- `/reset-password` - Set a new password (accessed via email link).
- `/verify-email` - Confirmation screen after signing up.
- `/auth/callback` - The backend route that processes Supabase OAuth and magic link callbacks.

## 👤 Citizen Routes
Routes specifically meant for citizens to interact with the platform. Protected by session state.
- `/citizen` - The Citizen Dashboard. Shows an overview of their submitted grievances.
- `/onboarding` - First-time setup for citizens to complete their profile (name, phone, address).
- `/profile` - Profile management page to update personal details.
- `/notifications` - View all in-app notifications (status changes, messages from officers).

## 📝 Grievance Management (Citizen View)
- `/grievances/new` - The multi-step form to submit a new grievance (includes the AI assistant step).
- `/grievances/[id]` - The detailed view of a specific grievance, showing the timeline, attachments, and officer comments.
- `/grievances/[id]/confirmation` - The success page shown immediately after successfully submitting a grievance.
- `/grievances/[id]/appeal` - The form to submit an appeal if a citizen is unsatisfied with a resolved grievance.

## 🏢 Officer Routes
Routes restricted to Department Officers and Admins via Row Level Security and application logic.
- `/officer` - The Officer Dashboard. Shows all grievances assigned to their department.
- `/officer/grievances/[id]` - The officer's detailed view of a grievance. Includes actionable buttons to update status, assign to self, request information, and view internal details.

## 👑 Super Admin Routes
Routes restricted strictly to the `SUPER_ADMIN` and `DEPARTMENT_ADMIN` roles.
- `/admin/analytics` - The advanced analytics dashboard featuring charts (Recharts), department performance, and SLA compliance metrics.
- `/admin/audit-logs` - The immutable ledger view showing every sensitive action performed on the platform.

## 🔌 API Routes (Backend)
- `/api/ai/classify` - The Serverless Next.js endpoint that securely calls the Google Gemini API to automatically categorize and route citizen grievances based on plain-text descriptions.
