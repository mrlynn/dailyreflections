'use client';

const STEP4_STORAGE_KEY = 'guest_step4_inventory';

const isBrowser = () => typeof window !== 'undefined';

class BaseStep4Storage {
  async getInventory() {
    throw new Error('Not implemented');
  }

  async saveInventory() {
    throw new Error('Not implemented');
  }
}

class GuestStep4Storage extends BaseStep4Storage {
  constructor({ guestId } = {}) {
    super();
    this.guestId = guestId || 'default';
    this.storageKey = `${STEP4_STORAGE_KEY}:${this.guestId}`;
  }

  _read() {
    if (!isBrowser()) return null;
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to read guest step4 inventory from localStorage:', error);
      return null;
    }
  }

  _write(data) {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to write guest step4 inventory to localStorage:', error);
    }
  }

  async getInventory() {
    const data = this._read();
    if (!data) {
      return {
        inventory: {
          resentments: [],
          fears: [],
          sexConduct: { relationships: [], patterns: '', idealBehavior: '' },
          harmsDone: [],
        },
        activeStep: 0,
        progress: null,
        updatedAt: null,
      };
    }
    return data;
  }

  async saveInventory(payload) {
    const data = {
      inventory: payload.inventory || {
        resentments: [],
        fears: [],
        sexConduct: { relationships: [], patterns: '', idealBehavior: '' },
        harmsDone: [],
      },
      activeStep: payload.activeStep ?? 0,
      progress: payload.progress ?? null,
      updatedAt: payload.updatedAt || new Date().toISOString(),
    };

    this._write(data);
    return data;
  }

  async clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(this.storageKey);
  }
}

class AuthenticatedStep4Storage extends BaseStep4Storage {
  async getInventory(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`/api/step4${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    if (!response.ok) {
      throw new Error('Failed to load inventory');
    }
    return response.json();
  }

  async saveInventory(payload) {
    const response = await fetch('/api/step4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to save inventory' }));
      throw new Error(errorData.error || 'Failed to save inventory');
    }

    return response.json();
  }
}

export function createStep4Storage(mode = 'authenticated', options = {}) {
  if (mode === 'guest') {
    return new GuestStep4Storage({ guestId: options.guestId });
  }
  return new AuthenticatedStep4Storage();
}

export { GuestStep4Storage, AuthenticatedStep4Storage };

