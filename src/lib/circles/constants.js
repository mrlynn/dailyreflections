export const CIRCLE_COLLECTIONS = Object.freeze({
  CIRCLES: 'circles',
  MEMBERS: 'circle_members',
  POSTS: 'circle_posts',
  COMMENTS: 'circle_comments',
  INVITES: 'circle_invites',
});

export const CIRCLE_VISIBILITY = Object.freeze({
  PUBLIC: 'public',
  PRIVATE: 'private',
});

export const CIRCLE_ROLES = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
});

export const CIRCLE_MEMBER_STATUS = Object.freeze({
  ACTIVE: 'active',
  PENDING: 'pending',
  LEFT: 'left',
  REMOVED: 'removed',
});

export const CIRCLE_POST_TYPES = Object.freeze({
  SHARE: 'share',
  STEP_EXPERIENCE: 'step-experience',
  LINKED_ENTRY: 'linked-entry',
});

export const CIRCLE_POST_LIMITS = Object.freeze({
  MAX_LENGTH: Number.parseInt(process.env.CIRCLE_POST_MAX_LENGTH ?? '2000', 10),
  MAX_TAGS: Number.parseInt(process.env.CIRCLE_POST_MAX_TAGS ?? '5', 10),
  MAX_TAG_LENGTH: 24,
});

export const CIRCLE_COMMENT_LIMITS = Object.freeze({
  MAX_LENGTH: Number.parseInt(process.env.CIRCLE_COMMENT_MAX_LENGTH ?? '750', 10),
});

export const CIRCLE_FEED_DEFAULT_PAGE_SIZE = Number.parseInt(
  process.env.CIRCLE_FEED_PAGE_SIZE ?? '20',
  10,
);
export const CIRCLE_FEED_MAX_PAGE_SIZE = Number.parseInt(
  process.env.CIRCLE_FEED_MAX_PAGE_SIZE ?? '50',
  10,
);

export const CIRCLE_INVITE_MODES = Object.freeze({
  SINGLE_USE: 'single-use',
  MULTI_USE: 'multi-use',
});

export const CIRCLE_DEFAULTS = Object.freeze({
  MAX_MEMBERS: 20,
  MAX_MEMBERS_LIMIT: 50,
  INVITE_EXPIRATION_DAYS: 14,
  VISIBILITY: CIRCLE_VISIBILITY.PRIVATE,
});

export const CIRCLE_TYPES = Object.freeze(['general', 'sponsor-circle', 'step-group']);

export const CIRCLE_LIMITS = Object.freeze({
  MAX_CIRCLES_PER_USER: Number.parseInt(process.env.CIRCLES_MAX_PER_USER ?? '5', 10),
});

export const CIRCLE_INVITE_MAX_DAYS = 90;

export const CIRCLE_LINKED_SOURCE_TYPES = Object.freeze([
  'tenth_step',
  'step4_inventory',
  'reflection',
]);

