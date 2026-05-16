import PatientsListView from '@/components/features/patients/PatientsListView';

export default function PatientsPage() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      <PatientsListView />
    </div>
  );
}
