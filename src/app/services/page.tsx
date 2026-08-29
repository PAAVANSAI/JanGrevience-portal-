"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";

interface Service {
  id: string;
  title: string;
  agency: string;
  category: string;
  description: string;
  modality: string;
  timeframe: string;
  apply_url: string;
}

interface DeptSLA {
  department: string;
  deadline: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<DeptSLA[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // Load Services
      const { data: svcData } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (svcData) setServices(svcData);

      // Load Departments and SLA Rules for the bottom section
      const { data: deptData } = await supabase
        .from("departments")
        .select("name, categories(name, sla_rules(time_limit, unit))")
        .eq("is_active", true)
        .order("name");

      if (deptData) {
        const mappedDepts = deptData.map((d: any) => {
          // Find max timeframe from categories
          let maxDays = 30; // default fallback
          d.categories?.forEach((cat: any) => {
            cat.sla_rules?.forEach((rule: any) => {
              let days = rule.time_limit;
              if (rule.unit === "HOURS") days = days / 24;
              if (days > maxDays) maxDays = days;
            });
          });

          // Generate some dummy descriptions based on dept name to match mock
          let desc = "Handles issues related to " + d.name.toLowerCase();
          if (d.name.toLowerCase().includes("education")) desc = "Schools admissions, scholarships and teaching staff.";
          if (d.name.toLowerCase().includes("police") || d.name.toLowerCase().includes("safety")) desc = "Public safety, complaint follow-up and law enforcement services.";
          if (d.name.toLowerCase().includes("transport")) desc = "Public transport, licensing, permits and road safety.";
          if (d.name.toLowerCase().includes("electricity")) desc = "Power supply, outages, metering and billing.";
          if (d.name.toLowerCase().includes("health")) desc = "Hospitals, primary health centres and public health services.";
          if (d.name.toLowerCase().includes("water")) desc = "Drinking water supply, quality, billing and sewerage.";
          if (d.name.toLowerCase().includes("municipal")) desc = "Sanitation, roads, drainage, street lighting and civic upkeep.";
          if (d.name.toLowerCase().includes("revenue")) desc = "Land records, mutation, certificates and revenue matters.";

          return {
            department: d.name,
            deadline: `${Math.round(maxDays)} days`,
            desc
          };
        });
        setDepartments(mappedDepts);
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const categories = ["All categories", ...Array.from(new Set(services.map(s => s.category)))];

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                          s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All categories" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue mb-2">Citizen portal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy tracking-tight">Services & departments</h1>
          <p className="text-text-secondary mt-2 max-w-2xl">
            Apply for everyday government services, and see which department handles which kind of grievance.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1 max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              placeholder="Search services, e.g. passport"
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-blue/20 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative sm:w-64">
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-blue/20 transition-all shadow-sm appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {loading ? (
            <div className="col-span-1 md:col-span-2 py-20 text-center text-text-muted">Loading services...</div>
          ) : filteredServices.length === 0 ? (
            <div className="col-span-1 md:col-span-2 py-20 text-center text-text-muted">No services found matching your search.</div>
          ) : (
            filteredServices.map((service) => (
              <div key={service.id} className="bg-surface border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-bold text-navy text-lg">{service.title}</h3>
                  <span className="shrink-0 px-2 py-1 bg-blue-50 text-blue-800 text-xs font-semibold rounded whitespace-nowrap">
                    {service.category}
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-4">{service.agency}</p>
                <p className="text-sm text-text-primary mb-6 flex-1">
                  {service.description}
                </p>
                
                <p className="text-sm text-text-secondary font-medium mb-4">
                  <span className="font-bold text-navy">{service.modality}</span> - {service.timeframe}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm font-semibold pt-4 border-t border-border mt-auto">
                  {service.apply_url && (
                    <a href={service.apply_url} target="_blank" rel="noopener noreferrer" className="text-blue hover:text-blue-hover flex items-center gap-1">
                      Apply on official portal
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                  )}
                  <a href={`/grievances/new?service=${encodeURIComponent(service.title)}`} className="text-text-muted hover:text-navy underline underline-offset-4 decoration-border hover:decoration-navy transition-all">
                    Report a problem with this service
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Grievance Departments */}
        <div className="border-t border-border pt-12 mb-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-navy">Grievance departments</h2>
            <p className="text-text-secondary mt-1">
              These departments handle grievances on this portal, with their published resolution deadline.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-navy mb-1">{dept.department}</h3>
                <p className="text-xs text-text-muted mb-4 line-clamp-2 h-8">{dept.desc}</p>
                <p className="text-xs text-text-secondary font-medium">
                  Resolution deadline: <span className="text-navy">{dept.deadline}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
