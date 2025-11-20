import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import Step4 from '@/lib/models/Step4';
import mongoose, { initMongoose } from '@/lib/mongoose';

/**
 * GET /api/step4
 * Retrieve user's 4th step inventory
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const providedPassword = url.searchParams.get('password');
    const inventoryId = url.searchParams.get('id'); // Optional ID if user has multiple inventories

    // Connect to database with encryption enabled
    await connectToDatabase({
      withEncryption: true,
      collection: 'step4'
    });

    // Initialize mongoose connection
    await initMongoose();

    // Query parameters
    const query = {
      userId: new mongoose.Types.ObjectId(userId),
      status: { $ne: 'archived' } // Don't return archived inventories by default
    };

    // If specific inventory ID is provided
    if (inventoryId) {
      query._id = new mongoose.Types.ObjectId(inventoryId);
    }

    // Get user's most recent active inventory, or create a new one
    let inventory;
    if (inventoryId) {
      inventory = await Step4.findOne(query);
    } else {
      // Get the most recently updated inventory
      inventory = await Step4.findOne(query).sort({ lastActive: -1 });
    }

    const formatInventoryForResponse = (doc) => {
      if (!doc) {
        return doc;
      }

      const raw = doc.toObject ? doc.toObject() : doc;
      return {
        ...raw,
        sponsorFeedback: {
          resentments: Array.isArray(raw?.sponsorFeedback?.resentments) ? raw.sponsorFeedback.resentments : [],
          fears: Array.isArray(raw?.sponsorFeedback?.fears) ? raw.sponsorFeedback.fears : [],
          sexConduct: Array.isArray(raw?.sponsorFeedback?.sexConduct) ? raw.sponsorFeedback.sexConduct : [],
          harmsDone: Array.isArray(raw?.sponsorFeedback?.harmsDone) ? raw.sponsorFeedback.harmsDone : []
        }
      };
    };

    // Default empty inventory with no password protection
    const defaultInventory = {
      userId: new mongoose.Types.ObjectId(userId),
      startedAt: new Date(),
      lastActive: new Date(),
      status: 'in_progress',
      progress: {
        currentStep: 0,
        resentmentsComplete: false,
        fearsComplete: false,
        sexConductComplete: false,
        harmsDoneComplete: false
      },
      resentments: [],
      fears: [],
      sexConduct: {
        relationships: [],
        patterns: '',
        idealBehavior: ''
      },
      harmsDone: [],
      sponsorFeedback: {
        resentments: [],
        fears: [],
        sexConduct: [],
        harmsDone: []
      },
      isPasswordProtected: false,
      passwordHint: ''
    };

    // If no inventory exists yet, return default
    if (!inventory) {
      return NextResponse.json({ inventory: defaultInventory });
    }

    // Check if inventory is password protected
    if (inventory.isPasswordProtected) {
      // If no password provided, return only the protection status and hint
      if (!providedPassword) {
        return NextResponse.json({
          isPasswordProtected: true,
          passwordHint: inventory.passwordHint || '',
          needsPassword: true,
          inventoryId: inventory._id
        });
      }

      // If password provided, verify it
      const passwordIsValid = await bcrypt.compare(providedPassword, inventory.passwordHash);
      if (!passwordIsValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 403 });
      }

      // Password is valid, strip the hash before returning
      const inventoryObj = inventory.toObject();
      const { passwordHash, ...safeInventory } = inventoryObj;

      // Update last active timestamp
      await Step4.updateOne(
        { _id: inventory._id },
        { $set: { lastActive: new Date() } }
      );

      return NextResponse.json({ inventory: formatInventoryForResponse(safeInventory) });
    }

    // Not password protected, return full inventory and update last active timestamp
    await Step4.updateOne(
      { _id: inventory._id },
      { $set: { lastActive: new Date() } }
    );

    return NextResponse.json({ inventory: formatInventoryForResponse(inventory) });
  } catch (error) {
    console.error('Error retrieving 4th step inventory:', error);
    return NextResponse.json({ error: 'Failed to retrieve inventory' }, { status: 500 });
  }
}

/**
 * GET /api/step4/list
 * List all user's 4th step inventories
 */
export async function GET_LIST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Connect to database
    await connectToDatabase();

    // Initialize mongoose connection
    await initMongoose();

    // Get all user's inventories (summaries only)
    const inventories = await Step4.find(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        _id: 1,
        startedAt: 1,
        lastActive: 1,
        status: 1,
        progress: 1,
        isPasswordProtected: 1,
        passwordHint: 1
      }
    ).sort({ lastActive: -1 });

    return NextResponse.json({ inventories });
  } catch (error) {
    console.error('Error listing 4th step inventories:', error);
    return NextResponse.json({ error: 'Failed to retrieve inventory list' }, { status: 500 });
  }
}

/**
 * POST /api/step4
 * Save user's 4th step inventory
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();
    const {
      password,
      currentPassword,
      passwordHint,
      inventoryId,
      activeStep, // Current step user is on
      markAsComplete, // Whether to mark this section as complete
      ...inventory
    } = data;

    // Connect to database with encryption enabled
    await connectToDatabase({
      withEncryption: true,
      collection: 'step4'
    });

    // Initialize mongoose connection
    await initMongoose();

    // Find the specified inventory or the most recent one
    let query = { userId: new mongoose.Types.ObjectId(userId) };
    if (inventoryId) {
      query._id = new mongoose.Types.ObjectId(inventoryId);
    }

    const existingInventory = await Step4.findOne(query).sort({ lastActive: -1 });

    // Calculate progress state
    const progress = existingInventory?.progress || {
      currentStep: 0,
      resentmentsComplete: false,
      fearsComplete: false,
      sexConductComplete: false,
      harmsDoneComplete: false
    };

    // Update progress based on user's activity
    if (activeStep !== undefined) {
      progress.currentStep = activeStep;
    }

    if (markAsComplete) {
      // Mark the appropriate section as complete based on the current step
      switch(activeStep) {
        case 1: // Resentments step
          progress.resentmentsComplete = true;
          break;
        case 2: // Fears step
          progress.fearsComplete = true;
          break;
        case 3: // Sex Conduct step
          progress.sexConductComplete = true;
          break;
        case 4: // Harms Done step
          progress.harmsDoneComplete = true;
          break;
      }
    }

    // Handle password protection
    let updatedFields = {
      ...inventory,
      userId: new mongoose.Types.ObjectId(userId),
      lastActive: new Date(),
      progress
    };

    // For new inventories, add creation date
    if (!existingInventory) {
      updatedFields.startedAt = new Date();
      updatedFields.status = 'in_progress';
    }

    // Check if we're updating password settings
    if (password !== undefined) {
      // If inventory exists and is already password protected, verify current password
      if (existingInventory?.isPasswordProtected) {
        if (!currentPassword) {
          return NextResponse.json({
            error: 'Current password required to change password settings'
          }, { status: 403 });
        }

        const passwordIsValid = await bcrypt.compare(currentPassword, existingInventory.passwordHash);
        if (!passwordIsValid) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
        }
      }

      // Setting a new password
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        updatedFields.passwordHash = passwordHash;
        updatedFields.isPasswordProtected = true;
        updatedFields.passwordHint = passwordHint || '';
      }
      // Removing password protection
      else {
        updatedFields.isPasswordProtected = false;
        updatedFields.passwordHash = null;
        updatedFields.passwordHint = '';
      }
    } else if (existingInventory?.isPasswordProtected && !currentPassword) {
      // If inventory is password protected but no current password provided
      // We're just updating content, not password settings
      // Keep the existing password protection settings
      updatedFields.isPasswordProtected = existingInventory.isPasswordProtected;
      updatedFields.passwordHash = existingInventory.passwordHash;
      updatedFields.passwordHint = existingInventory.passwordHint;
    }

    // Insert or update inventory
    if (existingInventory) {
      await Step4.updateOne({ _id: existingInventory._id }, { $set: updatedFields });
      return NextResponse.json({ success: true, inventoryId: existingInventory._id });
    } else {
      // Create new inventory
      const newInventory = new Step4(updatedFields);
      await newInventory.save();
      return NextResponse.json({ success: true, inventoryId: newInventory._id });
    }
  } catch (error) {
    console.error('Error saving 4th step inventory:', error);
    return NextResponse.json({ error: 'Failed to save inventory' }, { status: 500 });
  }
}

/**
 * POST /api/step4/restart
 * Create a new 4th step inventory, optionally archiving the old one
 */
export async function RESTART(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();
    const { oldInventoryId, archiveOld = true } = data;

    // Connect to database
    await connectToDatabase();

    // Initialize mongoose connection
    await initMongoose();

    // If specified, archive the old inventory
    if (oldInventoryId && archiveOld) {
      await Step4.updateOne(
        {
          _id: new mongoose.Types.ObjectId(oldInventoryId),
          userId: new mongoose.Types.ObjectId(userId)
        },
        { $set: { status: 'archived' } }
      );
    }

    // Create a new blank inventory
    const newInventory = new Step4({
      userId: new mongoose.Types.ObjectId(userId),
      startedAt: new Date(),
      lastActive: new Date(),
      status: 'in_progress',
      progress: {
        currentStep: 0,
        resentmentsComplete: false,
        fearsComplete: false,
        sexConductComplete: false,
        harmsDoneComplete: false
      },
      resentments: [],
      fears: [],
      sexConduct: {
        relationships: [],
        patterns: '',
        idealBehavior: ''
      },
      harmsDone: [],
      sponsorFeedback: {
        resentments: [],
        fears: [],
        sexConduct: [],
        harmsDone: []
      },
      isPasswordProtected: false
    });

    await newInventory.save();

    return NextResponse.json({
      success: true,
      inventoryId: newInventory._id
    });
  } catch (error) {
    console.error('Error restarting 4th step inventory:', error);
    return NextResponse.json({ error: 'Failed to restart inventory' }, { status: 500 });
  }
}