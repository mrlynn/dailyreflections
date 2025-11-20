'use server';

import { ObjectId } from 'mongodb';
import { getCirclesCollection } from './db';

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

export async function generateUniqueCircleSlug(name, fallbackId) {
  const base = slugify(name) || `circle-${fallbackId?.toString?.().slice(-6) || Date.now()}`;

  const circlesCollection = await getCirclesCollection('CIRCLES');

  let candidate = base;
  let counter = 1;

  while (true) {
    const existing = await circlesCollection.findOne({ slug: candidate }, { projection: { _id: 1 } });
    if (!existing) {
      return candidate;
    }

    counter += 1;
    candidate = `${base}-${counter}`;
    if (candidate.length > 70) {
      candidate = `${base.slice(0, 60)}-${counter}`;
    }
  }
}

