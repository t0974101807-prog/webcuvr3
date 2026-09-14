import React from "react";
import SecurityView from "./SecurityView";

interface RealtimeMonitoringDashboardProps {
  language?: "vi" | "en";
  records?: any[];
  users?: any[];
  events?: any[];
  defaultTab?: "lawfirm_overview" | "hr_dashboard" | "finance_kpi" | "monitor" | "guidelines";
}

export default function RealtimeMonitoringDashboard({
  language = "vi",
  records = [],
  users = [],
  events = [],
  defaultTab = "lawfirm_overview"
}: RealtimeMonitoringDashboardProps) {
  return (
    <div className="w-full my-6">
      <SecurityView
        language={language}
        records={records}
        users={users}
        events={events}
        defaultTab={defaultTab}
      />
    </div>
  );
}
