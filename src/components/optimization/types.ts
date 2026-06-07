export interface DiskInfo {
  deviceId: string;
  freeSpaceGb: number;
  totalSizeGb: number;
  isRecommended: boolean;
}

export interface PageFileEntry {
  name: string;
  initialSizeMb: number;
  maximumSizeMb: number;
}

export interface SystemPageFileStatus {
  automaticManaged: boolean;
  pageFiles: PageFileEntry[];
  disks: DiskInfo[];
}
