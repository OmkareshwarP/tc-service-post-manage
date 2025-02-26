import { extendType, nonNull, stringArg } from 'nexus';
import { generateResponse, logError } from '../utils/index.js';

export const PostMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createPost', {
      type: 'GenericResponse',
      args: {
        content: nonNull(stringArg()),
      },
      async resolve(_, { content }, { req }) {
        try {
          if (!content) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }
          return generateResponse(false, 'post created successfully.', '', 200, 'done');
        } catch (error) {
          logError(error.message, 'createPostError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while creating post. We're working on it`, 'createPostError', 500, null);
        }
      },
    });
  },
});
