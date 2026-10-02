import { useState } from "react";
import {
  GitBranch,
  Play,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  GitPullRequest,
  Ban,
  X,
  Bell,
  Trash2,
} from "lucide-react";

import { FaGithub } from "react-icons/fa";

const dummyNotifications = [
  {
    id: 1,
    type: "github",
    title: "GitHub Connected",
    message: "Your GitHub account was successfully connected.",
    time: "2 min ago",
    unread: true,
  },
  {
    id: 2,
    type: "repository",
    title: "Repository Added",
    message: "Evidence-Correlated-RCA-CICD-Security was added successfully.",
    time: "5 min ago",
    unread: true,
  },
  {
    id: 3,
    type: "pipeline",
    title: "Pipeline Started",
    message: "Analysis has started for the main branch.",
    time: "8 min ago",
    unread: true,
  },
  {
    id: 4,
    type: "sonarqube",
    title: "SonarQube Analysis Started",
    message: "SonarQube is analyzing your latest commit.",
    time: "10 min ago",
    unread: false,
  },
  {
    id: 5,
    type: "sonarqube",
    title: "SonarQube Analysis Completed",
    message: "Analysis completed with 12 issues detected.",
    time: "12 min ago",
    unread: false,
  },
  {
    id: 6,
    type: "security",
    title: "Security Scan Started",
    message: "Semgrep, Trivy, and Gitleaks scans are now running.",
    time: "15 min ago",
    unread: false,
  },
  {
    id: 7,
    type: "security",
    title: "Security Issues Found",
    message: "The security scan detected vulnerabilities that require attention.",
    time: "18 min ago",
    unread: false,
  },
  {
    id: 8,
    type: "correlation",
    title: "Root Cause Analysis Completed",
    message: "Findings have been correlated with commits to identify possible root causes.",
    time: "22 min ago",
    unread: false,
  },
  {
    id: 9,
    type: "pipeline",
    title: "Pipeline Completed",
    message: "All analysis stages completed successfully.",
    time: "25 min ago",
    unread: false,
  },
  {
    id: 10,
    type: "deployment",
    title: "Deployment Blocked",
    message: "Deployment was blocked because critical findings were detected.",
    time: "30 min ago",
    unread: false,
  },
];

const notificationConfig: Record<
  string,
  {
    icon: React.ElementType;
    iconClass: string;
    bgClass: string;
  }
> = {
  github: {
    icon: FaGithub,
    iconClass: "text-gray-800",
    bgClass: "bg-gray-100",
  },
  repository: {
    icon: GitBranch,
    iconClass: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  pipeline: {
    icon: Play,
    iconClass: "text-violet-600",
    bgClass: "bg-violet-50",
  },
  sonarqube: {
    icon: CheckCircle2,
    iconClass: "text-green-600",
    bgClass: "bg-green-50",
  },
  security: {
    icon: ShieldAlert,
    iconClass: "text-orange-600",
    bgClass: "bg-orange-50",
  },
  correlation: {
    icon: GitPullRequest,
    iconClass: "text-purple-600",
    bgClass: "bg-purple-50",
  },
  deployment: {
    icon: Ban,
    iconClass: "text-red-600",
    bgClass: "bg-red-50",
  },
};

function PopNotification() {
  const [notifications, setNotifications] =
    useState(dummyNotifications);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const clearAll = () => {
    setNotifications([]);
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  return (
    <div className="absolute right-4 top-4 z-50 w-105 max-md:w-[calc(100vw-2rem)] h-120 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden flex flex-col">

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell size={18} className="text-gray-800" />

              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-semibold">
                  {unreadCount}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Pipeline activity
              </h2>

              <p className="text-[11px] text-gray-500">
                Recent updates from your pipelines
              </p>
            </div>
          </div>

          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition cursor-pointer"
            title="Clear all"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="mt-3 text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">

        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6">

            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Bell size={20} className="text-gray-400" />
            </div>

            <p className="text-sm font-medium text-gray-700">
              No notifications
            </p>

            <p className="text-xs text-gray-400 mt-1 text-center">
              Pipeline updates and security events will appear here.
            </p>

          </div>
        ) : (
          notifications.map((notification) => {
            const config =
              notificationConfig[notification.type] ??
              notificationConfig.pipeline;

            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className={`relative flex gap-3 px-4 py-3.5 border-b border-gray-100 transition hover:bg-gray-50 cursor-pointer ${
                  notification.unread
                    ? "bg-blue-50/40"
                    : "bg-white"
                }`}
              >

                {/* Unread indicator */}
                {notification.unread && (
                  <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}

                {/* Icon */}
                <div
                  className={`shrink-0 w-9 h-9 rounded-lg ${config.bgClass} flex items-center justify-center`}
                >
                  <Icon
                    size={17}
                    className={config.iconClass}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">

                  <div className="flex items-start justify-between gap-2">

                    <p className="text-xs font-semibold text-gray-900 leading-4">
                      {notification.title}
                    </p>

                    <span className="shrink-0 text-[10px] text-gray-400">
                      {notification.time}
                    </span>

                  </div>

                  <p className="mt-1 text-[11px] leading-4 text-gray-500">
                    {notification.message}
                  </p>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50">
          <button className="w-full text-xs font-medium text-gray-600 hover:text-gray-900 transition cursor-pointer">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
}

export default PopNotification;