import { extendType, nonNull, nullable, stringArg } from 'nexus';
import { generateResponse, logError } from '../utils/index.js';
import AuthUtil from '../auth/index.js';

export const PostQueries = extendType({
  type: 'Query',
  definition(t) {
    t.field('hello', {
      type: 'GenericResponse',
      async resolve() {
        try {
          return generateResponse(false, 'fecthed successfully', '', 200, 'Hello world!');
        } catch (error) {
          logError(error.message, 'helloError', 5, error);
          return generateResponse(true, `Something went wrong. We're working on it`, 'helloError', 500, null);
        }
      },
    });
    t.field('getUserPostsById', {
      type: 'PostsResponse',
      args: {
        userId: nonNull(stringArg()),
        lastCreatedAt: nullable(stringArg()),
      },
      async resolve(_, { userId, lastCreatedAt }, { dataSources, req }) {
        const token = req.headers.authorization;
        await AuthUtil().verifyToken(token);
        try {
          if (!userId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }

          if (lastCreatedAt) {
            const parsed = Number(lastCreatedAt);
            lastCreatedAt = isNaN(parsed) ? null : parsed;
          }

          const response = await dataSources.PostAPI().getUserPostsById(userId, lastCreatedAt);
          return response;
        } catch (error) {
          logError(error.message, 'getUserPostsByIdError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while getting user posts. We're working on it`, 'getUserPostsByIdError', 500, null);
        }
      },
    });
    t.field('getPostInfo', {
      type: 'GetPostInfoResponse',
      args: {
        postId: nonNull(stringArg()),
      },
      async resolve(_, { postId }, { dataSources, req }) {
        const token = req.headers.authorization;
        await AuthUtil().verifyToken(token);
        try {
          if (!postId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }

          const response = await dataSources.PostAPI().getPostInfo(postId);
          return response;
        } catch (error) {
          logError(error.message, 'getPostInfoError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while fetching post details. We're working on it`, 'getPostInfoError', 500, null);
        }
      },
    });
    t.field('getPostReplies', {
      type: 'PostsResponse',
      args: {
        postId: nonNull(stringArg()),
        lastCreatedAt: nullable(stringArg()),
      },
      async resolve(_, { postId, lastCreatedAt }, { dataSources, req }) {
        const token = req.headers.authorization;
        await AuthUtil().verifyToken(token);
        try {
          if (!postId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }

          if (lastCreatedAt) {
            const parsed = Number(lastCreatedAt);
            lastCreatedAt = isNaN(parsed) ? null : parsed;
          }

          const response = await dataSources.PostAPI().getPostReplies(postId, lastCreatedAt);
          return response;
        } catch (error) {
          logError(error.message, 'getPostRepliesError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while getting post replies. We're working on it`, 'getPostRepliesError', 500, null);
        }
      },
    });
    t.field('getUserLikes', {
      type: 'UserEngagementPostsResponse',
      args: {
        lastCreatedAt: nullable(stringArg()),
      },
      async resolve(_, { lastCreatedAt }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          if (lastCreatedAt) {
            const parsed = Number(lastCreatedAt);
            lastCreatedAt = isNaN(parsed) ? null : parsed;
          }

          const response = await dataSources.PostAPI().getUserLikedPostsById(user.userId, lastCreatedAt);
          return response;
        } catch (error) {
          logError(error.message, 'getUserLikesError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while getting user likes. We're working on it`, 'getUserLikesError', 500, null);
        }
      },
    });
    t.field('getUserBookmarks', {
      type: 'UserEngagementPostsResponse',
      args: {
        lastCreatedAt: nullable(stringArg()),
      },
      async resolve(_, { lastCreatedAt }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          if (lastCreatedAt) {
            const parsed = Number(lastCreatedAt);
            lastCreatedAt = isNaN(parsed) ? null : parsed;
          }

          const response = await dataSources.PostAPI().getUserBookmarkedPostsById(user.userId, lastCreatedAt);
          return response;
        } catch (error) {
          logError(error.message, 'getUserBookmarksError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while getting user bookmarks. We're working on it`, 'getUserBookmarksError', 500, null);
        }
      },
    });
    t.field('checkPostLikeStatus', {
      type: 'PostLikeStatusResponse',
      args: {
        postId: nonNull(stringArg()),
      },
      async resolve(_, { postId }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          if (!postId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }

          const response = await dataSources.PostAPI().checkPostLikeStatus(user.userId, postId);
          return response;
        } catch (error) {
          logError(error.message, 'checkPostLikeStatusError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while checking post liked status. We're working on it`, 'checkPostLikeStatusError', 500, null);
        }
      },
    });
    t.field('checkPostBookmarkStatus', {
      type: 'PostBookmarkStatusResponse',
      args: {
        postId: nonNull(stringArg()),
      },
      async resolve(_, { postId }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          if (!postId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }

          const response = await dataSources.PostAPI().checkPostBookmarkStatus(user.userId, postId);
          return response;
        } catch (error) {
          logError(error.message, 'checkPostBookmarkStatusError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while checking post Bookmark status. We're working on it`, 'checkPostBookmarkStatusError', 500, null);
        }
      },
    });
    t.field('checkPostRepostStatus', {
      type: 'PostRepostStatusResponse',
      args: {
        postId: nonNull(stringArg()),
      },
      async resolve(_, { postId }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          if (!postId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }

          const response = await dataSources.PostAPI().checkPostRepostStatus(user.userId, postId);
          return response;
        } catch (error) {
          logError(error.message, 'checkPostRepostStatusError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while checking post repost status. We're working on it`, 'checkPostRepostStatusError', 500, null);
        }
      },
    });
  },
});
