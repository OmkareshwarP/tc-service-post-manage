import { getMongoDBClient } from '../database/mongoUtil.js';
import { createNeo4jSession } from '../database/neo4jUtil.js';
import { IPost } from '../typeDefs.js';
import { generateAlphaNumericId, generateResponse, getCurrentEpochTimestamp, publishMessageToBgsChannel } from '../utils/index.js';

export const PostAPI = () => {
  return {
    async createPost(inputArgs: any) {
      const { userId, content, postType, postVisibility, media, parentPostId, threadParentPostId, repostedPostId, poll, ip } = inputArgs;
      try {
        const currentEpochTimestamp = getCurrentEpochTimestamp();
        if (poll) {
          poll.startAt = poll.startAt ? parseInt(poll.startAt) : currentEpochTimestamp;
          poll.endAt = parseInt(poll.endAt);
          poll.votes = {};
          for (const option of poll.options) {
            poll.votes[option] = 0;
          }
        }

        const postId = generateAlphaNumericId(20);
        const _post: IPost = {
          postId,
          userId,
          content,
          media,
          postType,
          postVisibility,
          parentPostId,
          threadParentPostId,
          repostedPostId,
          poll,
          engagementScore: 0.0,
          repostCount: 0,
          likes: 0,
          comments: 0,
          bookmarks: 0,
          impressions: 0,
          status: 'published',
          createdAt: currentEpochTimestamp,
          updatedAt: currentEpochTimestamp,
        };

        const dbClient = getMongoDBClient();
        const _postCollectionName = process.env.POSTS_COLLECTION;

        try {
          await dbClient.collection(_postCollectionName).insertOne({ ..._post });
        } catch (err) {
          if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return generateResponse(true, `${field} already exists`, `${field}AlreadyExists`, 400, null);
          } else {
            throw err;
          }
        }

        const session = createNeo4jSession();
        const neo4jRoot = process.env.NEO4J_ROOT;
        const postNode = `${neo4jRoot}:${postId}`;
        try {
          await session.run(
            `MERGE (p:Post {id: $postNode})
            ON CREATE SET p.postId = $postId, p.userId = $userId, p.engagementScore = $engagementScore, p.createdAt = $createdAt`,
            { postNode, postId, userId, engagementScore: 0.0, createdAt: _post.createdAt }
          );
        } catch (error) {
          throw error;
        } finally {
          await session.close();
        }

        const postBgMessageData: any = {
          messageName: 'postCreated',
          entityId: postId,
          entityType: 'post',
          actionInputOne: ip,
        };
        publishMessageToBgsChannel(postBgMessageData);

        return generateResponse(false, 'Post successfully created', '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
  };
};
