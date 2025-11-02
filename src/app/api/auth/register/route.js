import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required.' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      image: null,
      emailVerified: null,
      createdAt: new Date(),
    };

    const result = await db.collection('users').insertOne(user);

    // Return user (without password)
    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        email: user.email,
        name: user.name,
        message: 'Account created successfully. Please sign in.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account.' },
      { status: 500 }
    );
  }
}

