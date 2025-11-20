export function serializeCircle(circleDoc, membership) {
  if (!circleDoc) return null;

  return {
    id: circleDoc._id?.toString(),
    slug: circleDoc.slug,
    name: circleDoc.name,
    description: circleDoc.description,
    type: circleDoc.type,
    maxMembers: circleDoc.maxMembers,
    memberCount: circleDoc.memberCount ?? 0,
    createdBy: circleDoc.createdBy?.toString(),
    visibility: circleDoc.visibility,
    createdAt: circleDoc.createdAt,
    updatedAt: circleDoc.updatedAt,
    membership: membership
      ? {
          role: membership.role,
          status: membership.status,
          joinedAt: membership.joinedAt,
        }
      : undefined,
  };
}

export function serializeCircleSummary(circleDoc, membership) {
  if (!circleDoc) return null;
  return {
    id: circleDoc._id?.toString(),
    slug: circleDoc.slug,
    name: circleDoc.name,
    description: circleDoc.description,
    type: circleDoc.type,
    visibility: circleDoc.visibility,
    memberCount: circleDoc.memberCount,
    maxMembers: circleDoc.maxMembers,
    membership: membership
      ? {
          role: membership.role,
          status: membership.status,
          joinedAt: membership.joinedAt,
        }
      : undefined,
    updatedAt: circleDoc.updatedAt,
  };
}

export function serializeCirclePost(postDoc, viewerId) {
  if (!postDoc) return null;

  const authorDoc = postDoc.author || postDoc.user;
  const serialized = {
    id: postDoc._id?.toString(),
    circleId: postDoc.circleId?.toString(),
    authorId: postDoc.authorId?.toString(),
    type: postDoc.type,
    content: postDoc.content,
    stepTag: postDoc.stepTag ?? null,
    tags: postDoc.tags ?? [],
    commentCount: postDoc.commentCount ?? 0,
    createdAt: postDoc.createdAt,
    updatedAt: postDoc.updatedAt,
    linkedSource: postDoc.linkedSource || null,
    isDeleted: postDoc.isDeleted ?? false,
    isPinned: postDoc.isPinned ?? false,
    pinnedAt: postDoc.pinnedAt ?? null,
    pinnedBy: postDoc.pinnedBy ? postDoc.pinnedBy.toString() : null,
  };

  if (authorDoc) {
    serialized.author = {
      id: authorDoc._id?.toString(),
      name: authorDoc.name ?? null,
      displayName: authorDoc.displayName ?? null,
      image: authorDoc.image ?? null,
    };
  }

  if (viewerId) {
    const authorIdString = postDoc.authorId?.toString();
    serialized.canEdit = authorIdString === viewerId;
  }

  if (postDoc.canPin !== undefined) {
    serialized.canPin = Boolean(postDoc.canPin);
  }

  return serialized;
}

export function serializeCircleComment(commentDoc, viewerId) {
  if (!commentDoc) return null;

  const authorDoc = commentDoc.author || commentDoc.user;
  const serialized = {
    id: commentDoc._id?.toString(),
    postId: commentDoc.postId?.toString(),
    circleId: commentDoc.circleId?.toString(),
    authorId: commentDoc.authorId?.toString(),
    content: commentDoc.content,
    parentId: commentDoc.parentId ? commentDoc.parentId.toString() : null,
    createdAt: commentDoc.createdAt,
    updatedAt: commentDoc.updatedAt,
    isDeleted: commentDoc.isDeleted ?? false,
  };

  if (authorDoc) {
    serialized.author = {
      id: authorDoc._id?.toString(),
      name: authorDoc.name ?? null,
      displayName: authorDoc.displayName ?? null,
      image: authorDoc.image ?? null,
    };
  }

  if (viewerId) {
    const authorIdString = commentDoc.authorId?.toString();
    serialized.canEdit = authorIdString === viewerId;
  }

  return serialized;
}

