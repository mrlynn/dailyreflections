import {
  CIRCLE_DEFAULTS,
  CIRCLE_INVITE_MAX_DAYS,
  CIRCLE_INVITE_MODES,
  CIRCLE_LIMITS,
  CIRCLE_POST_LIMITS,
  CIRCLE_POST_TYPES,
  CIRCLE_COMMENT_LIMITS,
  CIRCLE_TYPES,
  CIRCLE_VISIBILITY,
  CIRCLE_LINKED_SOURCE_TYPES,
} from './constants';
import { sanitizeRichText, stripHtmlToText } from '@/lib/sanitize';

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 600;

export function normalizeCirclePayload(payload = {}) {
  const errors = [];

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name) {
    errors.push('Circle name is required.');
  } else if (name.length < NAME_MIN_LENGTH) {
    errors.push(`Circle name must be at least ${NAME_MIN_LENGTH} characters.`);
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.push(`Circle name must be less than ${NAME_MAX_LENGTH} characters.`);
  }

  const description =
    typeof payload.description === 'string' ? payload.description.trim() : '';

  if (description && description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push('Description is too long.');
  }

  const type =
    typeof payload.type === 'string' && CIRCLE_TYPES.includes(payload.type)
      ? payload.type
      : 'general';

  if (payload.type && !CIRCLE_TYPES.includes(payload.type)) {
    errors.push('Invalid circle type.');
  }

  let maxMembers = Number.isInteger(payload.maxMembers)
    ? payload.maxMembers
    : CIRCLE_DEFAULTS.MAX_MEMBERS;

  if (maxMembers < 2) {
    errors.push('Circle must allow at least two members.');
  }

  if (maxMembers > CIRCLE_DEFAULTS.MAX_MEMBERS_LIMIT) {
    maxMembers = CIRCLE_DEFAULTS.MAX_MEMBERS_LIMIT;
  }

  const allowMultipleInvites =
    payload.allowMultipleInvites === undefined
      ? true
      : Boolean(payload.allowMultipleInvites);

  const visibility =
    typeof payload.visibility === 'string' &&
    Object.values(CIRCLE_VISIBILITY).includes(payload.visibility)
      ? payload.visibility
      : CIRCLE_DEFAULTS.VISIBILITY;

  if (payload.visibility && !Object.values(CIRCLE_VISIBILITY).includes(payload.visibility)) {
    errors.push('Invalid visibility option.');
  }

  const sanitized = {
    name,
    description,
    type,
    maxMembers,
    allowMultipleInvites,
    visibility,
  };

  return {
    isValid: errors.length === 0,
    errors,
    value: sanitized,
  };
}

export function assertCanCreateAnotherCircle(currentCount) {
  if (currentCount >= CIRCLE_LIMITS.MAX_CIRCLES_PER_USER) {
    const error = new Error(
      `You have reached the limit of ${CIRCLE_LIMITS.MAX_CIRCLES_PER_USER} active circles.`,
    );
    error.status = 400;
    error.code = 'CIRCLE_LIMIT_REACHED';
    throw error;
  }
}

export function normalizeInvitePayload(payload = {}) {
  const errors = [];

  const mode =
    typeof payload.mode === 'string' && Object.values(CIRCLE_INVITE_MODES).includes(payload.mode)
      ? payload.mode
      : CIRCLE_INVITE_MODES.MULTI_USE;

  let maxUses;

  if (mode === CIRCLE_INVITE_MODES.SINGLE_USE) {
    maxUses = 1;
  } else if (payload.maxUses !== undefined) {
    if (!Number.isInteger(payload.maxUses) || payload.maxUses < 1) {
      errors.push('maxUses must be a positive integer.');
    } else {
      maxUses = Math.min(payload.maxUses, 50);
    }
  }

  const expiresInDays =
    payload.expiresInDays !== undefined ? Number.parseInt(payload.expiresInDays, 10) : undefined;

  let expiresAt = null;
  if (Number.isInteger(expiresInDays) && expiresInDays > 0) {
    const safeDays = Math.min(expiresInDays, CIRCLE_INVITE_MAX_DAYS);
    const now = new Date();
    expiresAt = new Date(now.getTime() + safeDays * 24 * 60 * 60 * 1000);
  } else if (payload.expiresAt) {
    const candidate = new Date(payload.expiresAt);
    if (Number.isNaN(candidate.getTime())) {
      errors.push('expiresAt must be a valid date.');
    } else {
      const maxDate = new Date(Date.now() + CIRCLE_INVITE_MAX_DAYS * 24 * 60 * 60 * 1000);
      expiresAt = candidate > maxDate ? maxDate : candidate;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      mode,
      maxUses: maxUses ?? 10,
      expiresAt,
    },
  };
}

const TAG_PATTERN = /^[a-z0-9][a-z0-9-]{0,22}[a-z0-9]?$/i;
const STEP_MIN = 1;
const STEP_MAX = 12;

export function normalizePostPayload(payload = {}) {
  const errors = [];

  const type = Object.values(CIRCLE_POST_TYPES).includes(payload.type)
    ? payload.type
    : CIRCLE_POST_TYPES.SHARE;

  const rawContent = typeof payload.content === 'string' ? payload.content : '';
  const sanitizedContent = sanitizeRichText(rawContent).replace(/\n/g, '<br />');
  const plainText = stripHtmlToText(sanitizedContent);

  if (!plainText) {
    errors.push('Post content cannot be empty.');
  } else if (plainText.length > CIRCLE_POST_LIMITS.MAX_LENGTH) {
    errors.push(
      `Post content must be under ${CIRCLE_POST_LIMITS.MAX_LENGTH} characters. Consider trimming your share.`,
    );
  }

  let stepTag = null;
  if (payload.stepTag !== undefined && payload.stepTag !== null && payload.stepTag !== '') {
    const parsed = Number.parseInt(payload.stepTag, 10);
    if (Number.isNaN(parsed) || parsed < STEP_MIN || parsed > STEP_MAX) {
      errors.push('Step tag must be a number between 1 and 12.');
    } else {
      stepTag = parsed;
    }
  }

  const tags =
    Array.isArray(payload.tags) || typeof payload.tags === 'string'
      ? (Array.isArray(payload.tags) ? payload.tags : [payload.tags])
          .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
          .filter(Boolean)
      : [];

  const uniqueTags = [];
  for (const tag of tags) {
    if (!TAG_PATTERN.test(tag)) {
      errors.push(`Tag "${tag}" includes unsupported characters.`);
      continue;
    }
    if (!uniqueTags.includes(tag)) {
      uniqueTags.push(tag);
    }
    if (uniqueTags.length >= CIRCLE_POST_LIMITS.MAX_TAGS) break;
  }

  let linkedSource = null;
  if (payload.linkedSource && typeof payload.linkedSource === 'object') {
    const sourceType = payload.linkedSource.sourceType;
    const entryId =
      typeof payload.linkedSource.entryId === 'string' ? payload.linkedSource.entryId.trim() : null;
    const snapshot =
      typeof payload.linkedSource.snapshot === 'string'
        ? sanitizeRichText(payload.linkedSource.snapshot)
        : null;

    if (sourceType && !CIRCLE_LINKED_SOURCE_TYPES.includes(sourceType)) {
      errors.push('Linked entry source type is invalid.');
    } else if (sourceType && !entryId) {
      errors.push('Linked entry must include an identifier.');
    } else {
      linkedSource = {
        sourceType: sourceType ?? null,
        entryId,
        snapshot,
      };
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      type,
      content: sanitizedContent,
      stepTag,
      tags: uniqueTags,
      linkedSource,
    },
  };
}

export function normalizeCommentPayload(payload = {}) {
  const errors = [];
  const rawContent = typeof payload.content === 'string' ? payload.content : '';
  const sanitizedContent = sanitizeRichText(rawContent).replace(/\n/g, '<br />');
  const plainText = stripHtmlToText(sanitizedContent);

  if (!plainText) {
    errors.push('Comment cannot be empty.');
  } else if (plainText.length > CIRCLE_COMMENT_LIMITS.MAX_LENGTH) {
    errors.push(
      `Comment must be under ${CIRCLE_COMMENT_LIMITS.MAX_LENGTH} characters. Please shorten your reply.`,
    );
  }

  let parentId = null;
  if (payload.parentId) {
    parentId = typeof payload.parentId === 'string' ? payload.parentId : null;
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      content: sanitizedContent,
      parentId,
    },
  };
}

