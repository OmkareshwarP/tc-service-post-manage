import { arg, extendType, list, nonNull, nullable, stringArg } from 'nexus';
import { generateResponse, getIpFromRequest, logError, PostType } from '../utils/index.js';
import AuthUtil from '../auth/index.js';

export const PostMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createPost', {
      type: 'GenericResponse',
      args: {
        content: nonNull(stringArg()),
        postType: nonNull(arg({ type: 'PostType' })),
        postVisibility: nonNull(arg({ type: 'PostVisibility' })),
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

          if (!content || !postType || !postVisibility) {
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
  },
});
