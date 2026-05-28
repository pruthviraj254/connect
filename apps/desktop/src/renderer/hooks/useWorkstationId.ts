'use client';

import { useEffect, useState } from 'react';

export function useWorkstationId(): {
  workstationId: string;
  loading: boolean;
} {
  const [workstationId, setWorkstationId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMachineId = window.api?.app?.getMachineId;
    if (!getMachineId) {
      setLoading(false);
      return;
    }
    void getMachineId()
      .then((id) => setWorkstationId(id.trim()))
      .catch(() => {
        /* keep empty */
      })
      .finally(() => setLoading(false));
  }, []);

  return { workstationId, loading };
}
