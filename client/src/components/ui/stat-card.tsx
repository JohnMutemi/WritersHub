import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  actionText?: string;
  actionHref?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  actionText,
  actionHref,
  onClick
}: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            <div className={cn("text-xl", iconColor)}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {actionText && (
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            {actionHref ? (
              <a
                href={actionHref}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {actionText} <span className="align-text-bottom">→</span>
              </a>
            ) : (
              <button
                onClick={onClick}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {actionText} <span className="align-text-bottom">→</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
