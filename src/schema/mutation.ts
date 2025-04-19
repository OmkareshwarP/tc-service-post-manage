import { arg, booleanArg, extendType, intArg, list, nonNull, nullable, stringArg } from 'nexus';
import { generateResponse, getIpFromRequest, logError, PostType } from '../utils/index.js';
import AuthUtil from '../auth/index.js';

export const PostMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createPost', {
      type: 'GetPostInfoResponse',
      args: {
        postType: nonNull(arg({ type: 'PostType' })),
        postVisibility: nonNull(arg({ type: 'PostVisibility' })),
        content: nullable(stringArg()),
        media: nullable(list(nonNull(stringArg()))),
        parentPostId: nullable(stringArg()),
        threadParentPostId: nullable(stringArg()),
        repostedPostId: nullable(stringArg()),
        poll: nullable(arg({ type: 'PollInput' })),
      },
      async resolve(_, { content, postType, postVisibility, media, parentPostId, threadParentPostId, repostedPostId, poll }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          let isValidInput: boolean;

          if ((postType !== PostType.repost && !content) || !postType || !postVisibility) {
            isValidInput = false;
          } else if (postType === PostType.reply && (!parentPostId || parentPostId === '')) {
            isValidInput = false;
          } else if ((postType === PostType.repost || postType === PostType.quotePost) && (!repostedPostId || repostedPostId === '')) {
            isValidInput = false;
          } else if (poll && (!poll.options || poll.options.length < 2 || !poll.endAt)) {
            isValidInput = false;
          } else {
            isValidInput = true;
          }

          if (!isValidInput) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }

          const ip = getIpFromRequest(req);
          const response = await dataSources.PostAPI().createPost({ userId: user.userId, content, postType, postVisibility, media, parentPostId, threadParentPostId, repostedPostId, poll, ip });
          return response;
        } catch (error) {
          logError(error.message, 'createPostError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while creating post. We're working on it`, 'createPostError', 500, null);
        }
      },
    });
    t.field('togglePostLike', {
      type: 'GenericResponse',
      args: {
        postId: nonNull(stringArg()),
        isLiked: nonNull(booleanArg()),
      },
      async resolve(_, { postId, isLiked }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          if (!postId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }

          const response = await dataSources.PostAPI().togglePostLike(user.userId, postId, isLiked);
          return response;
        } catch (error) {
          logError(error.message, 'togglePostLikeError', 5, error);
          return generateResponse(true, `Something went wrong while toggling the post like. We're working on it.`, 'togglePostLikeError', 500, null);
        }
      },
    });
    t.field('togglePostBookmark', {
      type: 'GenericResponse',
      args: {
        postId: nonNull(stringArg()),
        isBookmarked: nonNull(booleanArg()),
      },
      async resolve(_, { postId, isBookmarked }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          if (!postId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }

          const response = await dataSources.PostAPI().togglePostBookmark(user.userId, postId, isBookmarked);
          return response;
        } catch (error) {
          logError(error.message, 'togglePostBookmarkError', 5, error);
          return generateResponse(true, `Something went wrong while toggling the post bookmark. We're working on it.`, 'togglePostBookmarkError', 500, null);
        }
      },
    });
    t.field('markPollResponse', {
      type: 'GenericResponse',
      args: {
        postId: nonNull(stringArg()),
        selectedOption: nonNull(intArg()),
      },
      async resolve(_, { postId, selectedOption }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          if (!postId || selectedOption === null || selectedOption === undefined || selectedOption < 0) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }

          const response = await dataSources.PostAPI().markPollResponse(user.userId, postId, selectedOption);
          return response;
        } catch (error) {
          logError(error.message, 'markPollResponseError', 5, error);
          return generateResponse(true, `Something went wrong while marking the poll response. We're working on it.`, 'markPollResponseError', 500, null);
        }
      },
    });
  },
});
