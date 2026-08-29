-- Phase 14: Analytics, Heatmaps & Reports
-- Create analytics functions for the dashboard

-- 1. get_analytics_summary
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
    p_department_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_grievances BIGINT,
    pending_grievances BIGINT,
    resolved_grievances BIGINT,
    overdue_grievances BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_grievances,
        COUNT(*) FILTER (WHERE status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')) as pending_grievances,
        COUNT(*) FILTER (WHERE status IN ('RESOLVED', 'CLOSED')) as resolved_grievances,
        COUNT(*) FILTER (WHERE due_date < timezone('utc'::text, now()) AND status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')) as overdue_grievances
    FROM public.grievances g
    WHERE 
        (p_department_id IS NULL OR g.department_id = p_department_id)
        AND (p_start_date IS NULL OR g.created_at >= p_start_date)
        AND (p_end_date IS NULL OR g.created_at <= p_end_date);
END;
$$;


-- 2. get_analytics_monthly_volume
CREATE OR REPLACE FUNCTION public.get_analytics_monthly_volume(
    p_department_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    month TEXT,
    grievances BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_char(date_trunc('month', g.created_at), 'Mon YYYY') as month,
        COUNT(*) as grievances
    FROM public.grievances g
    WHERE 
        (p_department_id IS NULL OR g.department_id = p_department_id)
        AND (p_start_date IS NULL OR g.created_at >= p_start_date)
        AND (p_end_date IS NULL OR g.created_at <= p_end_date)
    GROUP BY date_trunc('month', g.created_at)
    ORDER BY date_trunc('month', g.created_at) ASC;
END;
$$;


-- 3. get_analytics_department_distribution
CREATE OR REPLACE FUNCTION public.get_analytics_department_distribution(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    department_name TEXT,
    grievances BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.name as department_name,
        COUNT(g.id) as grievances
    FROM public.departments d
    LEFT JOIN public.grievances g ON g.department_id = d.id 
        AND (p_start_date IS NULL OR g.created_at >= p_start_date)
        AND (p_end_date IS NULL OR g.created_at <= p_end_date)
    GROUP BY d.name
    ORDER BY grievances DESC;
END;
$$;


-- 4. get_analytics_status_distribution
CREATE OR REPLACE FUNCTION public.get_analytics_status_distribution(
    p_department_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    status TEXT,
    count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.status::TEXT as status,
        COUNT(*) as count
    FROM public.grievances g
    WHERE 
        (p_department_id IS NULL OR g.department_id = p_department_id)
        AND (p_start_date IS NULL OR g.created_at >= p_start_date)
        AND (p_end_date IS NULL OR g.created_at <= p_end_date)
    GROUP BY g.status
    ORDER BY count DESC;
END;
$$;


-- 5. get_analytics_department_performance
CREATE OR REPLACE FUNCTION public.get_analytics_department_performance(
    p_department_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    department_name TEXT,
    total BIGINT,
    pending BIGINT,
    overdue BIGINT,
    resolution_rate_percent NUMERIC,
    sla_compliance_percent NUMERIC,
    avg_resolution_days NUMERIC,
    avg_satisfaction NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.name as department_name,
        COUNT(g.id) as total,
        COUNT(g.id) FILTER (WHERE g.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')) as pending,
        COUNT(g.id) FILTER (WHERE g.due_date < timezone('utc'::text, now()) AND g.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')) as overdue,
        
        -- Resolution Rate = resolved / total
        ROUND(COALESCE(
            (COUNT(g.id) FILTER (WHERE g.status IN ('RESOLVED', 'CLOSED'))::numeric / NULLIF(COUNT(g.id), 0)) * 100, 
        0), 1) as resolution_rate_percent,

        -- SLA Compliance % = resolved within SLA / total resolved (Simplified for this query)
        -- We just check if they are resolved and due_date >= updated_at
        ROUND(COALESCE(
            (COUNT(g.id) FILTER (WHERE g.status IN ('RESOLVED', 'CLOSED') AND g.due_date >= g.updated_at))::numeric 
            / NULLIF(COUNT(g.id) FILTER (WHERE g.status IN ('RESOLVED', 'CLOSED')), 0) * 100, 
        0), 1) as sla_compliance_percent,

        -- Avg Resolution Days
        ROUND(COALESCE(
            AVG(EXTRACT(EPOCH FROM (g.updated_at - g.created_at)) / 86400)::numeric, 
        0), 1) as avg_resolution_days,

        -- Avg Satisfaction
        ROUND(COALESCE(
            AVG(f.rating)::numeric, 
        0), 1) as avg_satisfaction
        
    FROM public.departments d
    LEFT JOIN public.grievances g ON g.department_id = d.id 
        AND (p_start_date IS NULL OR g.created_at >= p_start_date)
        AND (p_end_date IS NULL OR g.created_at <= p_end_date)
    LEFT JOIN public.feedback f ON f.grievance_id = g.id
    WHERE 
        (p_department_id IS NULL OR d.id = p_department_id)
    GROUP BY d.id, d.name
    ORDER BY total DESC;
END;
$$;


-- 6. get_analytics_geographic_breakdown
CREATE OR REPLACE FUNCTION public.get_analytics_geographic_breakdown(
    p_department_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    state TEXT,
    district TEXT,
    grievances BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.state as state,
        g.district as district,
        COUNT(*) as grievances
    FROM public.grievances g
    WHERE 
        (p_department_id IS NULL OR g.department_id = p_department_id)
        AND (p_start_date IS NULL OR g.created_at >= p_start_date)
        AND (p_end_date IS NULL OR g.created_at <= p_end_date)
        AND g.state IS NOT NULL 
        AND g.district IS NOT NULL
    GROUP BY g.state, g.district
    ORDER BY grievances DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_analytics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_monthly_volume TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_department_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_status_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_department_performance TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_geographic_breakdown TO authenticated;
