#!/bin/bash

###############################################################################
# Module B Production Deployment Script
#
# This script safely deploys Module B to the production database.
#
# Usage:
#   ./scripts/deploy/deployModuleB.sh [--backup] [--verify-only]
#
# Options:
#   --backup       Create a database backup before deploying
#   --verify-only  Only verify deployment, don't make changes
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Parse arguments
BACKUP=false
VERIFY_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --backup)
      BACKUP=true
      shift
      ;;
    --verify-only)
      VERIFY_ONLY=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

###############################################################################
# Functions
###############################################################################

print_header() {
  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}$1${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

confirm() {
  read -p "$(echo -e ${YELLOW}$1${NC}) (y/n) " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]]
}

###############################################################################
# Pre-flight Checks
###############################################################################

print_header "Module B Deployment - Pre-flight Checks"

# Check if .env.local exists
if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
  print_error ".env.local not found!"
  exit 1
fi
print_success ".env.local found"

# Load environment variables
source "$PROJECT_ROOT/.env.local"

# Check MongoDB URI
if [ -z "$MONGODB_URI" ]; then
  print_error "MONGODB_URI not set in .env.local"
  exit 1
fi
print_success "MongoDB URI configured"

# Check if mongosh is installed
if ! command -v mongosh &> /dev/null; then
  print_error "mongosh not installed. Please install MongoDB Shell."
  exit 1
fi
print_success "mongosh found"

# Check if seed script exists
SEED_SCRIPT="$PROJECT_ROOT/scripts/seed/seedModuleBOneDayAtATime.js"
if [ ! -f "$SEED_SCRIPT" ]; then
  print_error "Seed script not found at $SEED_SCRIPT"
  exit 1
fi
print_success "Seed script found"

# Check if images exist
IMAGE_DIR="$PROJECT_ROOT/public/images/one-day"
if [ ! -d "$IMAGE_DIR" ]; then
  print_error "Image directory not found: $IMAGE_DIR"
  exit 1
fi

REQUIRED_IMAGES=("lesson1.jpg" "lesson2.jpg" "lesson3.jpg" "lesson4.jpg")
for img in "${REQUIRED_IMAGES[@]}"; do
  if [ ! -f "$IMAGE_DIR/$img" ]; then
    print_error "Missing image: $img"
    exit 1
  fi
done
print_success "All 4 images found"

###############################################################################
# Database Connection Test
###############################################################################

print_header "Testing Database Connection"

if ! mongosh "$MONGODB_URI" --eval "db.adminCommand({ping: 1})" --quiet > /dev/null 2>&1; then
  print_error "Cannot connect to MongoDB"
  exit 1
fi
print_success "Connected to MongoDB"

###############################################################################
# Pre-Deployment Verification
###############################################################################

print_header "Pre-Deployment Verification"

# Check if course exists
COURSE_EXISTS=$(mongosh "$MONGODB_URI" --eval "db.courses.countDocuments({slug: 'first-30-days'})" --quiet)
if [ "$COURSE_EXISTS" -eq "0" ]; then
  print_error "Course 'first-30-days' not found. Please run main course seed first."
  exit 1
fi
print_success "Course 'first-30-days' exists"

# Check if Module B already exists
MODULE_B_EXISTS=$(mongosh "$MONGODB_URI" --eval "db.modules.countDocuments({slug: 'one-day-at-a-time'})" --quiet)
if [ "$MODULE_B_EXISTS" -gt "0" ]; then
  print_warning "Module B already exists in database"
  if ! confirm "Module B is already deployed. Continue anyway?"; then
    print_warning "Deployment cancelled"
    exit 0
  fi
fi

# Check current module and lesson counts
CURRENT_MODULES=$(mongosh "$MONGODB_URI" --eval "db.modules.countDocuments({courseId: db.courses.findOne({slug: 'first-30-days'})._id})" --quiet)
CURRENT_LESSONS=$(mongosh "$MONGODB_URI" --eval "db.lessons.countDocuments({courseId: db.courses.findOne({slug: 'first-30-days'})._id})" --quiet)

echo "Current state:"
echo "  Modules: $CURRENT_MODULES"
echo "  Lessons: $CURRENT_LESSONS"
echo ""
echo "After deployment:"
echo "  Modules: Expected 2"
echo "  Lessons: Expected 7"

###############################################################################
# Backup (if requested)
###############################################################################

if [ "$BACKUP" = true ]; then
  print_header "Creating Database Backup"

  BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP_DIR"

  print_warning "Creating backup at $BACKUP_DIR"
  if mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR" > /dev/null 2>&1; then
    print_success "Backup created successfully"
  else
    print_error "Backup failed"
    exit 1
  fi
fi

###############################################################################
# Final Confirmation
###############################################################################

if [ "$VERIFY_ONLY" = true ]; then
  print_header "Verification Complete"
  print_success "All pre-flight checks passed"
  print_warning "Running in verify-only mode. No changes made."
  exit 0
fi

print_header "Ready to Deploy"

echo "This will:"
echo "  ✓ Add Module B: 'one day at a time'"
echo "  ✓ Add 4 new lessons"
echo "  ✓ Update course with Module B reference"
echo ""

if ! confirm "Proceed with deployment?"; then
  print_warning "Deployment cancelled"
  exit 0
fi

###############################################################################
# Deploy Module B
###############################################################################

print_header "Deploying Module B"

cd "$PROJECT_ROOT"
if node "$SEED_SCRIPT"; then
  print_success "Seed script completed successfully"
else
  print_error "Seed script failed"
  exit 1
fi

###############################################################################
# Post-Deployment Verification
###############################################################################

print_header "Post-Deployment Verification"

# Verify module count
FINAL_MODULES=$(mongosh "$MONGODB_URI" --eval "db.modules.countDocuments({courseId: db.courses.findOne({slug: 'first-30-days'})._id})" --quiet)
if [ "$FINAL_MODULES" -eq "2" ]; then
  print_success "Module count correct: $FINAL_MODULES"
else
  print_error "Module count incorrect: $FINAL_MODULES (expected 2)"
fi

# Verify lesson count
FINAL_LESSONS=$(mongosh "$MONGODB_URI" --eval "db.lessons.countDocuments({courseId: db.courses.findOne({slug: 'first-30-days'})._id})" --quiet)
if [ "$FINAL_LESSONS" -eq "7" ]; then
  print_success "Lesson count correct: $FINAL_LESSONS"
else
  print_error "Lesson count incorrect: $FINAL_LESSONS (expected 7)"
fi

# Verify Module B exists
MODULE_B_FINAL=$(mongosh "$MONGODB_URI" --eval "db.modules.countDocuments({slug: 'one-day-at-a-time'})" --quiet)
if [ "$MODULE_B_FINAL" -eq "1" ]; then
  print_success "Module B created successfully"
else
  print_error "Module B not found after deployment"
fi

# Get Module B details
echo ""
echo "Module B Details:"
mongosh "$MONGODB_URI" --eval "db.modules.findOne({slug: 'one-day-at-a-time'}, {title: 1, order: 1, minSobrietyDays: 1, 'gatingRules.requireMeetingsAttended': 1})" --quiet

echo ""
echo "Module B Lessons:"
mongosh "$MONGODB_URI" --eval "db.lessons.find({moduleId: db.modules.findOne({slug: 'one-day-at-a-time'})._id}, {title: 1, order: 1, slug: 1}).sort({order: 1}).toArray()" --quiet

###############################################################################
# Deployment Complete
###############################################################################

print_header "Deployment Complete"

print_success "Module B successfully deployed!"

echo ""
echo "Next steps:"
echo "  1. Visit https://your-domain.com/course/first-30-days"
echo "  2. Complete Module A to unlock Module B"
echo "  3. Test all 4 Module B lessons"
echo "  4. Monitor analytics and user feedback"

echo ""
echo "Rollback instructions:"
echo "  See docs/module_b_deployment_guide.md"

if [ "$BACKUP" = true ]; then
  echo ""
  echo "Backup location:"
  echo "  $BACKUP_DIR"
fi

echo ""
print_success "Done!"
