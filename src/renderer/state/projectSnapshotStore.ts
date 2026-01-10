import { create } from 'zustand';

type ProjectSnapshotState = {
  selectedInstanceId: string | null;
  setSelectedInstanceId: (instanceId: string | null) => void;
};

export const useProjectSnapshotStore = create<ProjectSnapshotState>((set) => ({
  selectedInstanceId: 'instance-hero-001',
  setSelectedInstanceId: (instanceId) => set({ selectedInstanceId: instanceId }),
}));
