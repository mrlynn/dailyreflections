import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import Step9Model from '@/lib/models/Step9';
import mongoose from 'mongoose';

// GET: Get statistics about the Step 9 progress
export async function GET(request) {
  try {
    const session = await auth();

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await clientPromise; // Ensure MongoDB connection is established

    // Find the user's inventory
    const inventory = await Step9Model.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!inventory || !inventory.amendsEntries || inventory.amendsEntries.length === 0) {
      return NextResponse.json({
        totalEntries: 0,
        entriesPlanned: 0,
        entriesInProgress: 0,
        entriesCompleted: 0,
        entriesDeferred: 0,
        entriesNotPossible: 0,
        plannedPercentage: 0,
        completedPercentage: 0,
        priorityCounts: { high: 0, medium: 0, low: 0 },
        methodCounts: { in_person: 0, phone: 0, letter: 0, email: 0, indirect: 0, other: 0 },
        statusCounts: {
          not_started: 0,
          planned: 0,
          in_progress: 0,
          completed: 0,
          deferred: 0,
          not_possible: 0
        }
      });
    }

    // Get basic counts from progress field (these are maintained by the pre-save hook)
    const {
      totalEntries,
      entriesPlanned,
      entriesInProgress,
      entriesCompleted,
      entriesDeferred,
      entriesNotPossible
    } = inventory.progress;

    // Calculate percentages
    const plannedPercentage = totalEntries > 0 ?
      Math.round(((entriesPlanned + entriesInProgress + entriesCompleted) / totalEntries) * 100) : 0;

    const completedPercentage = totalEntries > 0 ?
      Math.round((entriesCompleted / totalEntries) * 100) : 0;

    // Count entries by priority
    const priorityCounts = {
      high: inventory.amendsEntries.filter(entry => entry.priority === 'high').length,
      medium: inventory.amendsEntries.filter(entry => entry.priority === 'medium').length,
      low: inventory.amendsEntries.filter(entry => entry.priority === 'low').length
    };

    // Count entries by amends method
    const methodCounts = {
      in_person: inventory.amendsEntries.filter(entry => entry.amendsMethod === 'in_person').length,
      phone: inventory.amendsEntries.filter(entry => entry.amendsMethod === 'phone').length,
      letter: inventory.amendsEntries.filter(entry => entry.amendsMethod === 'letter').length,
      email: inventory.amendsEntries.filter(entry => entry.amendsMethod === 'email').length,
      indirect: inventory.amendsEntries.filter(entry => entry.amendsMethod === 'indirect').length,
      other: inventory.amendsEntries.filter(entry => entry.amendsMethod === 'other').length
    };

    // Count entries by status
    const statusCounts = {
      not_started: inventory.amendsEntries.filter(entry => entry.amendStatus === 'not_started').length,
      planned: inventory.amendsEntries.filter(entry => entry.amendStatus === 'planned').length,
      in_progress: inventory.amendsEntries.filter(entry => entry.amendStatus === 'in_progress').length,
      completed: inventory.amendsEntries.filter(entry => entry.amendStatus === 'completed').length,
      deferred: inventory.amendsEntries.filter(entry => entry.amendStatus === 'deferred').length,
      not_possible: inventory.amendsEntries.filter(entry => entry.amendStatus === 'not_possible').length
    };

    return NextResponse.json({
      totalEntries,
      entriesPlanned,
      entriesInProgress,
      entriesCompleted,
      entriesDeferred,
      entriesNotPossible,
      plannedPercentage,
      completedPercentage,
      priorityCounts,
      methodCounts,
      statusCounts
    });

  } catch (error) {
    console.error('Error in GET /api/step9/stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Step 9 statistics' },
      { status: 500 }
    );
  }
}