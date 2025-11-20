'use client';

const GUEST_JOURNAL_STORAGE_KEY = 'guest_journal_entries';

const isBrowser = () => typeof window !== 'undefined';

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `guest-${crypto.randomUUID()}`;
  }
  return `guest-${Math.random().toString(36).slice(2)}`;
}

function normalizeDate(date) {
  if (!date) return null;
  if (date instanceof Date) {
    return date.toISOString();
  }
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

class BaseJournalStorage {
  async getEntries() {
    throw new Error('Not implemented');
  }

  async createEntry() {
    throw new Error('Not implemented');
  }

  async updateEntry() {
    throw new Error('Not implemented');
  }

  async deleteEntry() {
    throw new Error('Not implemented');
  }
}

class GuestJournalStorage extends BaseJournalStorage {
  constructor({ guestId } = {}) {
    super();
    this.guestId = guestId || 'default';
    this.storageKey = `${GUEST_JOURNAL_STORAGE_KEY}:${this.guestId}`;
  }

  _readEntries() {
    if (!isBrowser()) return [];
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const entries = JSON.parse(raw);
      if (!Array.isArray(entries)) return [];
      return entries;
    } catch (error) {
      console.warn('Failed to read guest journal entries from localStorage:', error);
      return [];
    }
  }

  _writeEntries(entries) {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to write guest journal entries to localStorage:', error);
    }
  }

  _filterEntries(entries, filters = {}) {
    const { startDate, endDate, tag } = filters;
    return entries.filter((entry) => {
      let include = true;

      if (startDate || endDate) {
        const entryDate = new Date(entry.date);
        if (startDate) {
          const start = new Date(startDate);
          if (entryDate < start) include = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (entryDate > end) include = false;
        }
      }

      if (include && tag) {
        const tags = entry.tags || [];
        include = Array.isArray(tags) ? tags.includes(tag) : false;
      }

      return include;
    });
  }

  async getEntries(filters = {}) {
    const entries = this._readEntries();
    const filtered = this._filterEntries(entries, filters);
    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    return filtered;
  }

  async createEntry(entryData) {
    const entries = this._readEntries();

    const now = new Date();
    const newEntry = {
      _id: entryData._id || generateId(),
      ...entryData,
      userId: entryData.userId || 'guest',
      date: normalizeDate(entryData.date) || now.toISOString(),
      createdAt: entryData.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (!newEntry.tags) {
      newEntry.tags = [];
    }

    entries.push(newEntry);
    this._writeEntries(entries);
    return newEntry;
  }

  async updateEntry(entryId, updates) {
    const entries = this._readEntries();
    const index = entries.findIndex((entry) => entry._id === entryId);
    if (index === -1) {
      throw new Error('Guest journal entry not found');
    }

    const now = new Date().toISOString();
    const updatedEntry = {
      ...entries[index],
      ...updates,
      date: updates.date ? normalizeDate(updates.date) : entries[index].date,
      updatedAt: now,
    };

    entries[index] = updatedEntry;
    this._writeEntries(entries);
    return updatedEntry;
  }

  async deleteEntry(entryId) {
    const entries = this._readEntries();
    const filtered = entries.filter((entry) => entry._id !== entryId);
    this._writeEntries(filtered);
    return { success: true };
  }

  async clearAll() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(this.storageKey);
  }
}

class AuthenticatedJournalStorage extends BaseJournalStorage {
  async getEntries(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await fetch(`/api/journal?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch journal entries');
    }

    const data = await response.json();
    return data.entries || [];
  }

  async createEntry(entryData) {
    const response = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create journal entry' }));
      throw new Error(errorData.error || 'Failed to create journal entry');
    }

    const data = await response.json();
    return data.entry;
  }

  async updateEntry(entryId, updates) {
    const response = await fetch(`/api/journal/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update journal entry' }));
      throw new Error(errorData.error || 'Failed to update journal entry');
    }

    const data = await response.json();
    return data.entry;
  }

  async deleteEntry(entryId) {
    const response = await fetch(`/api/journal/${entryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to delete journal entry' }));
      throw new Error(errorData.error || 'Failed to delete journal entry');
    }

    return { success: true };
  }
}

export function createJournalStorage(mode = 'authenticated', options = {}) {
  if (mode === 'guest') {
    return new GuestJournalStorage({ guestId: options.guestId });
  }
  return new AuthenticatedJournalStorage();
}

export { GuestJournalStorage, AuthenticatedJournalStorage };

