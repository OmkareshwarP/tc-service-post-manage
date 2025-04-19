import { getMongoDBClient } from '../database/mongoUtil.js';
import { createNeo4jSession } from '../database/neo4jUtil.js';
import { IPost } from '../typeDefs.js';
import { deletePostInformationById, deleteUserInformationByUserId, generateAlphaNumericId, generateResponse, getCurrentEpochTimestamp, PostType, publishMessageToBgsChannel } from '../utils/index.js';

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
          poll.options.forEach((_, index: number) => {
            poll.votes[index] = 0;
          });
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
          reposts: 0,
          likes: 0,
          comments: 0,
          bookmarks: 0,
          impressions: 0,
          status: 'published',
          createdAt: currentEpochTimestamp,
          updatedAt: currentEpochTimestamp,
        };

        const dbClient = getMongoDBClient();
        const _postsCollectionName = process.env.POSTS_COLLECTION;

        await dbClient.collection(_postsCollectionName).insertOne({ ..._post });

        const session = createNeo4jSession();
        const neo4jRoot = process.env.NEO4J_ROOT;
        const postNode = `${neo4jRoot}:${postId}`;
        try {
          await session.run(
            `MERGE (p:Post {id: $postNode})
            ON CREATE SET p.postId = $postId, p.userId = $userId, p.engagementScore = $engagementScore, p.createdAt = $createdAt, p.postType = $postType, p.postVisibility = $postVisibility`,
            { postNode, postId, userId, engagementScore: 0.0, createdAt: _post.createdAt, postType, postVisibility }
          );
        } catch (error) {
          throw error;
        } finally {
          await session.close();
        }

        if (postType === PostType.repost || postType === PostType.quotePost) {
          await dbClient.collection(_postsCollectionName).updateOne({ postId: repostedPostId }, { $inc: { reposts: 1 } });
          await deletePostInformationById(repostedPostId);
        }

        if (postType === PostType.reply) {
          await dbClient.collection(_postsCollectionName).updateOne({ postId: parentPostId }, { $inc: { comments: 1 } });
          await deletePostInformationById(parentPostId);
        }

        const _usersCollectionName = process.env.USERS_COLLECTION;
        await dbClient.collection(_usersCollectionName).updateOne({ userId }, { $inc: { postCount: 1 } });
        await deleteUserInformationByUserId(userId);

        const postBgMessageData: any = {
          messageName: 'postCreated',
          entityId: postId,
          entityType: 'post',
          actionInputOne: ip,
        };
        publishMessageToBgsChannel(postBgMessageData);

        return generateResponse(false, 'Post successfully created', '', 200, _post);
      } catch (error) {
        throw error;
      }
    },
    async getUserPostsById(userId: string, lastCreatedAt: number) {
      try {
        const dbClient = getMongoDBClient();
        const _postCollectionName = process.env.POSTS_COLLECTION;

        const query: any = { userId, status: 'published', postType: { $ne: 'reply' } };

        if (lastCreatedAt) {
          query.createdAt = { $lt: lastCreatedAt };
        }

        const posts = await dbClient.collection(_postCollectionName).find(query).sort({ createdAt: -1 }).limit(10).toArray();

        return generateResponse(false, 'User posts successfully fetched.', '', 200, posts);
      } catch (error) {
        throw error;
      }
    },
    async getPostInfo(postId: string) {
      try {
        const dbClient = getMongoDBClient();
        const _postCollectionName = process.env.POSTS_COLLECTION;

        const post = await dbClient.collection(_postCollectionName).findOne({ postId });
        if (!post) {
          return generateResponse(true, 'Post does not exist.', 'postNotFound', 404, null);
        } else if (post.status === 'unpublished') {
          return generateResponse(true, 'Post has been deleted by the user.', 'postDeleted', 404, null);
        } else {
          return generateResponse(false, 'Post fetched successfully.', '', 200, post);
        }
      } catch (error) {
        throw error;
      }
    },
    async getPostReplies(postId: string, lastCreatedAt: number) {
      try {
        const dbClient = getMongoDBClient();
        const _postCollectionName = process.env.POSTS_COLLECTION;

        const query: any = { parentPostId: postId, status: 'published', postType: 'reply' };

        if (lastCreatedAt) {
          query.createdAt = { $lt: lastCreatedAt };
        }

        const posts = await dbClient.collection(_postCollectionName).find(query).sort({ createdAt: -1 }).limit(10).toArray();

        return generateResponse(false, 'Post replies successfully fetched.', '', 200, posts);
      } catch (error) {
        throw error;
      }
    },
    async togglePostLike(userId: string, postId: string, isLiked: boolean) {
      try {
        const dbClient = getMongoDBClient();
        const _likesCollectionName = process.env.LIKES_COLLECTION;
        const _postsCollectionName = process.env.POSTS_COLLECTION;

        if (isLiked) {
          const _likeId = generateAlphaNumericId(15);
          const currentEpochTimestamp = getCurrentEpochTimestamp();

          const _likeData = {
            likeId: _likeId,
            postId,
            userId,
            createdAt: currentEpochTimestamp,
            updatedAt: currentEpochTimestamp,
          };

          try {
            await dbClient.collection(_likesCollectionName).insertOne({ ..._likeData });
          } catch (err) {
            if (err.code === 11000) {
              return generateResponse(false, `post liked successfully.`, '', 200, 'done');
            } else {
              throw err;
            }
          }

          await dbClient.collection(_postsCollectionName).updateOne({ postId }, { $inc: { likes: 1 } });
        } else {
          const res = await dbClient.collection(_likesCollectionName).deleteOne({ postId, userId });

          if (res.deletedCount > 0) {
            await dbClient.collection(_postsCollectionName).updateOne({ postId }, { $inc: { likes: -1 } });
          }
        }

        return generateResponse(false, `post ${isLiked ? 'liked' : 'unliked'} successfully.`, '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
    async getUserLikedPostsById(userId: string, lastCreatedAt: number) {
      try {
        const dbClient = getMongoDBClient();
        const _postCollectionName = process.env.POSTS_COLLECTION;
        const _likesCollectionName = process.env.LIKES_COLLECTION;
        const pageSize = 10;

        const likeQuery: any = { userId };

        if (lastCreatedAt) {
          likeQuery.createdAt = { $lt: lastCreatedAt };
        }

        const likedPosts = await dbClient.collection(_likesCollectionName).find(likeQuery).sort({ createdAt: -1 }).limit(pageSize).toArray();

        const postIds = likedPosts.map((like) => like.postId);

        let posts: IPost[] = [];

        if (postIds.length > 0) {
          posts = (await dbClient
            .collection(_postCollectionName)
            .find({ postId: { $in: postIds }, status: 'published' })
            .toArray()) as any;
        }

        const _res = {
          lastCreatedAt: likedPosts[pageSize - 1]?.createdAt.toString(),
          posts,
        };

        return generateResponse(false, 'User likes successfully fetched.', '', 200, _res);
      } catch (error) {
        throw error;
      }
    },
    async togglePostBookmark(userId: string, postId: string, isBookmarked: boolean) {
      try {
        const dbClient = getMongoDBClient();
        const _bookmarksCollectionName = process.env.BOOKMARKS_COLLECTION;
        const _postsCollectionName = process.env.POSTS_COLLECTION;

        if (isBookmarked) {
          const _bookmarkId = generateAlphaNumericId(15);
          const currentEpochTimestamp = getCurrentEpochTimestamp();

          const _bookmarkData = {
            bookmarkId: _bookmarkId,
            postId,
            userId,
            createdAt: currentEpochTimestamp,
            updatedAt: currentEpochTimestamp,
          };

          try {
            await dbClient.collection(_bookmarksCollectionName).insertOne({ ..._bookmarkData });
          } catch (err) {
            if (err.code === 11000) {
              return generateResponse(false, `Post added to bookmarks.`, '', 200, 'done');
            } else {
              throw err;
            }
          }

          await dbClient.collection(_postsCollectionName).updateOne({ postId }, { $inc: { bookmarks: 1 } });
        } else {
          const res = await dbClient.collection(_bookmarksCollectionName).deleteOne({ postId, userId });

          if (res.deletedCount > 0) {
            await dbClient.collection(_postsCollectionName).updateOne({ postId }, { $inc: { bookmarks: -1 } });
          }
        }

        let resMessage = 'Post added to bookmarks.';
        if (!isBookmarked) {
          resMessage = 'Post removed from bookmarks.';
        }

        return generateResponse(false, resMessage, '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
    async getUserBookmarkedPostsById(userId: string, lastCreatedAt: number) {
      try {
        const dbClient = getMongoDBClient();
        const _postCollectionName = process.env.POSTS_COLLECTION;
        const _bookmarksCollectionName = process.env.BOOKMARKS_COLLECTION;
        const pageSize = 10;

        const bookmarkQuery: any = { userId };

        if (lastCreatedAt) {
          bookmarkQuery.createdAt = { $lt: lastCreatedAt };
        }

        const bookmarkedPosts = await dbClient.collection(_bookmarksCollectionName).find(bookmarkQuery).sort({ createdAt: -1 }).limit(pageSize).toArray();

        const postIds = bookmarkedPosts.map((bookmark) => bookmark.postId);

        let posts: IPost[] = [];

        if (postIds.length > 0) {
          posts = (await dbClient
            .collection(_postCollectionName)
            .find({ postId: { $in: postIds }, status: 'published' })
            .toArray()) as any;
        }

        const _res = {
          lastCreatedAt: bookmarkedPosts[pageSize - 1]?.createdAt.toString(),
          posts,
        };

        return generateResponse(false, 'User bookmarks successfully fetched.', '', 200, _res);
      } catch (error) {
        throw error;
      }
    },
    async markPollResponse(userId: string, postId: string, selectedOption: number) {
      try {
        const dbClient = getMongoDBClient();
        const _pollResponseCollectionName = process.env.POLL_RESPONSES_COLLECTION;
        const _postsCollectionName = process.env.POSTS_COLLECTION;

        const _pollResponseId = generateAlphaNumericId(15);
        const currentEpochTimestamp = getCurrentEpochTimestamp();

        const _pollResponseData = {
          pollResponseId: _pollResponseId,
          postId,
          userId,
          selectedOption,
          createdAt: currentEpochTimestamp,
          updatedAt: currentEpochTimestamp,
        };

        try {
          await dbClient.collection(_pollResponseCollectionName).insertOne({ ..._pollResponseData });
        } catch (err) {
          if (err.code === 11000) {
            return generateResponse(false, `Poll response marked successfully.`, '', 200, 'done');
          } else {
            throw err;
          }
        }

        await dbClient.collection(_postsCollectionName).updateOne({ postId }, { $inc: { [`poll.votes.${selectedOption}`]: 1 } });

        return generateResponse(false, `Poll response marked successfully.`, '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },

    async checkPostLikeStatus(userId: string, postId: string) {
      try {
        const dbClient = getMongoDBClient();
        const _likesCollectionName = process.env.LIKES_COLLECTION;

        const likeData = await dbClient.collection(_likesCollectionName).findOne({ userId, postId });

        const isLiked = likeData ? true : false;

        return generateResponse(false, 'Post like status fetched successfully.', '', 200, { isLiked });
      } catch (error) {
        throw error;
      }
    },

    async checkPostBookmarkStatus(userId: string, postId: string) {
      try {
        const dbClient = getMongoDBClient();
        const _bookmarksCollectionName = process.env.BOOKMARKS_COLLECTION;

        const bookmarkData = await dbClient.collection(_bookmarksCollectionName).findOne({ userId, postId });

        const isBookmarked = bookmarkData ? true : false;

        return generateResponse(false, 'Post bookmark status fetched successfully.', '', 200, { isBookmarked });
      } catch (error) {
        throw error;
      }
    },
  };
};
