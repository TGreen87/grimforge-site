"use client";

import React from "react";
import { Segmented } from "antd";
import {
  BarChartOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import BusinessAnalytics from "./BusinessAnalytics";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { colors } from "../theme/tokens";

type AnalyticsView = "business" | "website";

export default function AdminAnalyticsPage() {
  const [view, setView] = React.useState<AnalyticsView>("business");

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-end">
        <Segmented
          value={view}
          onChange={(v) => setView(v as AnalyticsView)}
          options={[
            {
              value: "business",
              label: (
                <span className="flex items-center gap-2">
                  <BarChartOutlined />
                  Business
                </span>
              ),
            },
            {
              value: "website",
              label: (
                <span className="flex items-center gap-2">
                  <LineChartOutlined />
                  Website
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Content */}
      {view === "business" ? (
        <BusinessAnalytics />
      ) : (
        <AnalyticsDashboard defaultRange="7d" />
      )}
    </div>
  );
}
