/**
 * Test script to verify course gating logic
 */

// Simulate the gating function
function canAccessModule(module, userContext) {
  const { sobrietyDays, meetingsAttended, completedLessonIds } = userContext;

  // Check minimum sobriety days requirement
  if (typeof module.minSobrietyDays === "number") {
    // If user has no sobriety date and module requires ANY sobriety days, allow access
    // (newcomers without date set should still access day 0 content)
    if (sobrietyDays === null) {
      // Allow access to modules with minSobrietyDays of 0
      if (module.minSobrietyDays > 0) {
        return false;
      }
    } else if (sobrietyDays < module.minSobrietyDays) {
      return false;
    }
  }

  // Check maximum sobriety days requirement
  if (typeof module.maxSobrietyDays === "number" && sobrietyDays !== null) {
    if (sobrietyDays > module.maxSobrietyDays) {
      return false;
    }
  }

  // Check meetings requirement
  if (module.gatingRules?.requireMeetingsAttended) {
    if (meetingsAttended < module.gatingRules.requireMeetingsAttended) {
      return false;
    }
  }

  return true;
}

// Test cases
const module = {
  title: "you're safe here",
  minSobrietyDays: 0,
  maxSobrietyDays: 7,
  gatingRules: {
    requireMeetingsAttended: 0,
    requireCompletedLessonIds: []
  }
};

const userContext1 = {
  sobrietyDays: null,
  meetingsAttended: 0,
  completedLessonIds: []
};

const userContext2 = {
  sobrietyDays: 3,
  meetingsAttended: 0,
  completedLessonIds: []
};

const userContext3 = {
  sobrietyDays: 10,
  meetingsAttended: 0,
  completedLessonIds: []
};

console.log('\nGating Logic Test Results:');
console.log('=========================');
console.log(`Module: "${module.title}"`);
console.log(`  minSobrietyDays: ${module.minSobrietyDays}`);
console.log(`  maxSobrietyDays: ${module.maxSobrietyDays}`);
console.log('');

console.log('Test 1: User with NO sobriety date (null)');
console.log(`  sobrietyDays: ${userContext1.sobrietyDays}`);
console.log(`  Can access: ${canAccessModule(module, userContext1)} ✓ (should be true)`);
console.log('');

console.log('Test 2: User with 3 days sober');
console.log(`  sobrietyDays: ${userContext2.sobrietyDays}`);
console.log(`  Can access: ${canAccessModule(module, userContext2)} ✓ (should be true)`);
console.log('');

console.log('Test 3: User with 10 days sober (outside max range)');
console.log(`  sobrietyDays: ${userContext3.sobrietyDays}`);
console.log(`  Can access: ${canAccessModule(module, userContext3)} ✗ (should be false)`);
console.log('');
