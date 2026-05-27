import CallLogView from '@/components/features/call-log/CallLogView';

export default function CallLogPage() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      <CallLogView />
    </div>
  );
}
