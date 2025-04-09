import { getRedisClient } from '../database/redisUtil.js';
import { GraphQLError } from 'graphql';

interface Authentication {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifyToken: (token: string) => Promise<any>;
}

const AuthUtil = (): Authentication => {
  return {
    async verifyToken(token: string) {
      try {
        const redisKey = `${process.env.RK_AUTHTOKEN}:${token}`;
        const redisClient = getRedisClient();
        const userData = await redisClient.hGetAll(redisKey);
        if (Object.keys(userData).length) {
          return userData;
        }
        //tokenNotFound
        throw new GraphQLError('User is not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        });
      } catch (err) {
        throw err;
      }
    },
  };
};

export default AuthUtil;
