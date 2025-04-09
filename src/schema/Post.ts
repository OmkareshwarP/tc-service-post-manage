import { inputObjectType, enumType } from 'nexus';

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
