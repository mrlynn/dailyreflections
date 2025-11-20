// Script to seed the database with the 12 steps data
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'dailyreflections';

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

async function seedSteps() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const stepsCollection = db.collection('steps');

    // Check if steps already exist
    const count = await stepsCollection.countDocuments();
    if (count > 0) {
      console.log('Steps collection already has data. Skipping seed.');
      return;
    }

    // Define the 12 steps
    const stepsData = [
      {
        number: 1,
        title: "Honesty",
        text: "We admitted we were powerless over alcohol—that our lives had become unmanageable.",
        longForm: "We admitted we were powerless over alcohol—that our lives had become unmanageable.",
        interpretations: [
          "Step 1 is about honesty. We finally see and admit that we cannot control our drinking or drug use, and that it's causing serious problems in our lives.",
          "This step is the foundation of recovery, recognizing that willpower alone is not enough to overcome addiction."
        ],
        keyPoints: [
          "Admitting powerlessness over alcohol/addiction",
          "Acknowledging that life has become unmanageable",
          "Breaking through denial",
          "Surrender as the beginning of recovery",
          "The paradox: strength through admitting weakness"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 1: Bill's Story" },
          { title: "AA Big Book", chapter: "Chapter 2: There Is A Solution" },
          { title: "AA Big Book", chapter: "Chapter 3: More About Alcoholism" },
          { title: "12 Steps and 12 Traditions", chapter: "Step One" }
        ],
        reflectionReferences: [] // Will be populated dynamically by the API
      },
      {
        number: 2,
        title: "Hope",
        text: "Came to believe that a Power greater than ourselves could restore us to sanity.",
        longForm: "Came to believe that a Power greater than ourselves could restore us to sanity.",
        interpretations: [
          "Step 2 is about finding hope. We start to believe that something greater than ourselves—whether it's a traditional concept of God, the AA group, or another higher power—can help us recover.",
          "This step introduces the spiritual element of recovery, suggesting that we need help beyond our own capabilities."
        ],
        keyPoints: [
          "Finding hope for recovery",
          "Open-mindedness to spiritual help",
          "Understanding 'insanity' as continued self-destructive behavior",
          "The concept of a Higher Power being personal to each individual",
          "Beginning to trust in something beyond oneself"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 4: We Agnostics" },
          { title: "12 Steps and 12 Traditions", chapter: "Step Two" }
        ],
        reflectionReferences: [] // Will be populated dynamically
      },
      {
        number: 3,
        title: "Faith",
        text: "Made a decision to turn our will and our lives over to the care of God as we understood Him.",
        longForm: "Made a decision to turn our will and our lives over to the care of God as we understood Him.",
        interpretations: [
          "Step 3 is about making a decision to trust a higher power. We choose to put our recovery and our lives in the care of our higher power, however we understand it.",
          "This step involves surrendering control and trusting in the recovery process and spiritual principles."
        ],
        keyPoints: [
          "Making a decision to trust",
          "Surrendering self-will",
          "The phrase 'God as we understood Him' emphasizing personal spiritual choice",
          "The Third Step Prayer",
          "Moving from intellectual understanding to active commitment"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 5: How It Works" },
          { title: "12 Steps and 12 Traditions", chapter: "Step Three" }
        ],
        reflectionReferences: [] // Will be populated dynamically
      },
      {
        number: 4,
        title: "Courage",
        text: "Made a searching and fearless moral inventory of ourselves.",
        longForm: "Made a searching and fearless moral inventory of ourselves.",
        interpretations: [
          "Step 4 is about self-examination. We take a thorough look at our behaviors, thoughts, and emotions, especially focusing on resentments, fears, and harms done.",
          "This step requires courage to honestly examine our character defects and patterns that have contributed to our addiction."
        ],
        keyPoints: [
          "Thorough self-examination",
          "Identifying patterns in behavior and thinking",
          "Understanding the role of resentment in addiction",
          "Recognizing character defects",
          "The importance of being thorough and honest"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 5: How It Works" },
          { title: "AA Big Book", chapter: "Step 4 Inventory Guide (Appendix)" },
          { title: "12 Steps and 12 Traditions", chapter: "Step Four" }
        ],
        reflectionReferences: [] // Will be populated dynamically
      },
      {
        number: 5,
        title: "Integrity",
        text: "Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.",
        longForm: "Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.",
        interpretations: [
          "Step 5 is about confession. We share our inventory with our higher power, ourselves, and another person, usually a sponsor.",
          "This step helps break the isolation of addiction and begin the process of healing through honesty and vulnerability."
        ],
        keyPoints: [
          "Breaking the isolation of secrets",
          "Experiencing acceptance and forgiveness",
          "Seeing patterns more clearly through verbalization",
          "Sharing with someone who understands the process",
          "The relief that comes from complete honesty"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
          { title: "12 Steps and 12 Traditions", chapter: "Step Five" }
        ],
        reflectionReferences: [] // Will be populated dynamically
      },
      {
        number: 6,
        title: "Willingness",
        text: "Were entirely ready to have God remove all these defects of character.",
        longForm: "Were entirely ready to have God remove all these defects of character.",
        interpretations: [
          "Step 6 is about willingness to change. After identifying our character defects in Steps 4 and 5, we become ready to let them go.",
          "This step involves becoming willing to change and grow, recognizing that our character defects no longer serve us in recovery."
        ],
        keyPoints: [
          "Willingness to change",
          "Recognizing character defects that hurt ourselves and others",
          "The difference between intellectual willingness and emotional readiness",
          "Understanding that this is a process, not perfection",
          "Becoming ready to let go of old patterns"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
          { title: "12 Steps and 12 Traditions", chapter: "Step Six" }
        ],
        reflectionReferences: [] // Will be populated dynamically
      },
      {
        number: 7,
        title: "Humility",
        text: "Humbly asked Him to remove our shortcomings.",
        longForm: "Humbly asked Him to remove our shortcomings.",
        interpretations: [
          "Step 7 is about humility. We ask our higher power to help remove our character defects.",
          "This step acknowledges that we need help beyond our own efforts to truly change our deep-seated patterns."
        ],
        keyPoints: [
          "The central importance of humility in recovery",
          "Asking for help to change",
          "The Seventh Step Prayer",
          "Understanding that removal of defects happens gradually",
          "Transformation through surrender and acceptance"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
          { title: "12 Steps and 12 Traditions", chapter: "Step Seven" }
        ],
        reflectionReferences: [] // Will be populated dynamically
      },
      {
        number: 8,
        title: "Brotherly Love",
        text: "Made a list of all persons we had harmed, and became willing to make amends to them all.",
        longForm: "Made a list of all persons we had harmed, and became willing to make amends to them all.",
        interpretations: [
          "Step 8 is about preparing for amends. We list all the people we've harmed and become willing to make amends to them.",
          "This step helps us take responsibility for our past actions and prepares us for the direct amends in Step 9."
        ],
        keyPoints: [
          "Taking responsibility for past actions",
          "Recognizing the full extent of harm done to others",
          "Becoming willing to make amends, even to those who have harmed us",
          "Developing empathy for those we've hurt",
          "Preparing mentally and emotionally for the amends process"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
          { title: "12 Steps and 12 Traditions", chapter: "Step Eight" }
        ],
        reflectionReferences: [] // Will be populated dynamically
      },
      {
        number: 9,
        title: "Justice",
        text: "Made direct amends to such people wherever possible, except when to do so would injure them or others.",
        longForm: "Made direct amends to such people wherever possible, except when to do so would injure them or others.",
        interpretations: [
          "Step 9 is about making amends. We directly address the harms we've caused others, except when doing so would cause more harm.",
          "This step allows us to clear away the wreckage of our past and rebuild relationships based on honesty and responsibility."
        ],
        keyPoints: [
          "Making direct amends whenever possible",
          "Different types of amends: direct, living, and indirect",
          "The wisdom in 'except when to do so would injure them or others'",
          "The timing and approach of making amends",
          "The freedom that comes from taking responsibility"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
          { title: "12 Steps and 12 Traditions", chapter: "Step Nine" }
        ],
        reflectionReferences: [] // Will be populated dynamically
      },
      {
        number: 10,
        title: "Perseverance",
        text: "Continued to take personal inventory and when we were wrong promptly admitted it.",
        longForm: "Continued to take personal inventory and when we were wrong promptly admitted it.",
        interpretations: [
          "Step 10 is about maintaining awareness. We continue to watch for problematic behaviors and attitudes, and promptly address them.",
          "This step establishes an ongoing practice of self-examination and accountability that supports long-term recovery."
        ],
        keyPoints: [
          "Daily self-examination",
          "Promptly admitting wrongs",
          "The concept of the 'spot-check inventory'",
          "Making amends quickly to maintain serenity",
          "Building the habit of continuous self-awareness"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
          { title: "12 Steps and 12 Traditions", chapter: "Step Ten" }
        ],
        reflectionReferences: [] // Will be populated dynamically
      },
      {
        number: 11,
        title: "Spirituality",
        text: "Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.",
        longForm: "Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.",
        interpretations: [
          "Step 11 is about spiritual connection. We develop practices like prayer and meditation to strengthen our relationship with our higher power.",
          "This step focuses on seeking guidance and strength for recovery, rather than trying to control outcomes."
        ],
        keyPoints: [
          "Developing a spiritual practice",
          "The complementary roles of prayer and meditation",
          "Seeking guidance rather than specific outcomes",
          "Creating conscious contact with one's higher power",
          "The practical aspects of spiritual growth"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 11: A Vision For You" },
          { title: "12 Steps and 12 Traditions", chapter: "Step Eleven" }
        ],
        reflectionReferences: [] // Will be populated dynamically
      },
      {
        number: 12,
        title: "Service",
        text: "Having had a spiritual awakening as the result of these steps, we tried to carry this message to alcoholics, and to practice these principles in all our affairs.",
        longForm: "Having had a spiritual awakening as the result of these steps, we tried to carry this message to alcoholics, and to practice these principles in all our affairs.",
        interpretations: [
          "Step 12 is about helping others and living the principles. Having experienced the benefits of the program, we help others who still suffer and apply these principles in all aspects of our lives.",
          "This step completes the cycle of recovery, from being helped to helping others, and extends recovery principles beyond addiction into daily living."
        ],
        keyPoints: [
          "The nature of spiritual awakening",
          "Carrying the message to others who still suffer",
          "Service as essential to maintaining recovery",
          "Applying program principles to all life areas",
          "Living a life of continued growth and service"
        ],
        resources: [
          { title: "AA Big Book", chapter: "Chapter 7: Working With Others" },
          { title: "AA Big Book", chapter: "Chapter 11: A Vision For You" },
          { title: "12 Steps and 12 Traditions", chapter: "Step Twelve" }
        ],
        reflectionReferences: [] // Will be populated dynamically
      }
    ];

    // Insert the steps into the database
    const result = await stepsCollection.insertMany(stepsData);
    console.log(`${result.insertedCount} steps were successfully added to the database`);

  } catch (error) {
    console.error('Error seeding steps:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seed function
seedSteps().catch(console.error);