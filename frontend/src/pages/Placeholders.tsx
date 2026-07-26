import React from 'react';

interface PlaceholderProps {
  title: string;
  description?: string;
  iconName: string;
}

const BasePlaceholder: React.FC<PlaceholderProps> = ({ title, description, iconName }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-primary/5 text-primary p-5 rounded-full mb-4 animate-pulse">
        <span className="material-icons text-5xl" style={{ fontSize: '48px' }}>{iconName}</span>
      </div>
      <h2 className="text-2xl font-bold font-poppins text-[#333333] mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md mb-6 font-inter text-sm">
        {description || 'This administrative module is part of the Pakistan Chamber of Education ERP and is scheduled for a future development phase.'}
      </p>
      <div className="inline-flex items-center gap-2 bg-[#F0F4F2] text-primary border border-primary/10 px-4 py-2 rounded-lg font-poppins font-medium text-xs">
        <span className="material-icons text-sm">info</span>
        Module not yet built
      </div>
    </div>
  );
};

export const DashboardPlaceholder: React.FC = () => (
  <BasePlaceholder title="Dashboard Overview" iconName="dashboard" />
);

export const ApplicationsPlaceholder: React.FC = () => (
  <BasePlaceholder title="Membership Applications" iconName="assignment" />
);

export const MembersPlaceholder: React.FC = () => (
  <BasePlaceholder title="Members Directory" iconName="people" />
);

export const DocumentsPlaceholder: React.FC = () => (
  <BasePlaceholder title="Document Vault" iconName="folder" />
);

export const DuesPlaceholder: React.FC = () => (
  <BasePlaceholder title="Dues & Contributions" iconName="account_balance_wallet" />
);

export const ChallansPlaceholder: React.FC = () => (
  <BasePlaceholder title="Challan Management" iconName="receipt" />
);

export const PaymentsPlaceholder: React.FC = () => (
  <BasePlaceholder title="Payments & Receipts" iconName="payments" />
);

export const AccountingPlaceholder: React.FC = () => (
  <BasePlaceholder title="General Ledger Accounting" iconName="analytics" />
);

export const NotificationsPlaceholder: React.FC = () => (
  <BasePlaceholder title="Notification Logs" iconName="notifications" />
);

export const AuditLogsPlaceholder: React.FC = () => (
  <BasePlaceholder title="System Audit Logs" iconName="history" />
);

export const SettingsPlaceholder: React.FC = () => (
  <BasePlaceholder title="System Settings" iconName="settings" />
);

// End of Placeholders
