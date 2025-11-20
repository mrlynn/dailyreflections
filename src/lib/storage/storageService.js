'use client';

import { createJournalStorage } from './journalStorage';
import { createStep4Storage } from './step4Storage';

export function createStorageService(mode = 'authenticated', options = {}) {
  return {
    mode,
    journal: createJournalStorage(mode, options),
    step4: createStep4Storage(mode, options),
  };
}

