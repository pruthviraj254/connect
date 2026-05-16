import ApiLogsView from '@/components/features/api-logs/ApiLogsView';

export default function ApiLogsPage() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      <ApiLogsView />
    </div>
  );
}
