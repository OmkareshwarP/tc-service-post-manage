import { inputObjectType, enumType, objectType, scalarType } from 'nexus';
import { GraphQLJSON } from 'graphql-type-json';

export const PostTypeEnum = enumType({
  name: 'PostType',
  members: ['post', 'reply', 'repost', 'quotePost'],
});

export const PostVisibilityEnum = enumType({
  name: 'PostVisibility',
  members: ['public', 'followers', 'circle', 'community', 'protected'],
});

export const PollInputType = inputObjectType({
  name: 'PollInput',
  definition(t) {
    t.nonNull.list.nonNull.string('options');
    t.nullable.string('startAt');
    t.nonNull.string('endAt');
  },
});

export const Json = scalarType({
  name: 'Json',
  asNexusMethod: 'json',
  parseValue: GraphQLJSON.parseValue,
  serialize: GraphQLJSON.serialize,
  parseLiteral: GraphQLJSON.parseLiteral,
});

export const PollData = objectType({
  name: 'PollData',
  definition(t) {
    t.nonNull.list.nonNull.string('options');
    t.nonNull.field('votes', { type: 'Json' });
    t.nullable.string('startAt');
    t.nonNull.string('endAt');
  },
});

export const PostData = objectType({
  name: 'PostData',
  definition(t) {
    t.nonNull.string('postId');
    t.nonNull.string('userId');
    t.nonNull.field('postType', { type: 'PostType' });
    t.nonNull.field('postVisibility', { type: 'PostVisibility' });
    t.nullable.string('content');
    t.nullable.list.nonNull.string('media');
    t.nullable.string('parentPostId');
    t.nullable.string('threadParentPostId');
    t.nullable.string('repostedPostId');
    t.nullable.field('poll', { type: 'PollData' });
    t.nullable.int('reposts');
    t.nullable.float('engagementScore');
    t.nullable.int('likes');
    t.nullable.int('comments');
    t.nullable.int('bookmarks');
    t.nullable.int('impressions');
    t.nonNull.string('status');
    t.nonNull.string('createdAt');
    t.nonNull.string('updatedAt');
  },
});

export const PostsResponse = objectType({
  name: 'PostsResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nonNull.list.nonNull.field('data', { type: 'PostData' });
  },
});

export const GetPostInfoResponse = objectType({
  name: 'GetPostInfoResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'PostData' });
  },
});

export const UserEngagementPostsData = objectType({
  name: 'UserEngagementPostsData',
  definition(t) {
    t.nullable.string('lastCreatedAt');
    t.nonNull.list.nonNull.field('posts', { type: 'PostData' });
  },
});

export const UserEngagementPostsResponse = objectType({
  name: 'UserEngagementPostsResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'UserEngagementPostsData' });
  },
});
