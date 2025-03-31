/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateResponse } from '../utils/index.js';

export const PostAPI = () => {
  return {
    async createPost(inputArgs: any) {
      const { userId, content } = inputArgs;
      try {
        return generateResponse(false, 'Post successfully created', '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
  };
};
