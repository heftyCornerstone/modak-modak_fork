import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import useUser from '@hooks/common/useUser';

import { CommentsType } from '@queries/group/comments/fetchComments';
import createComment from '@queries/group/comments/createComment';
import { GroupsType } from '@ts/supabaseTableRowTypes';
import { PostCacheListType } from '@ts/postType';

interface CommentInputParams {
  postId: string;
  groupId: GroupsType['id'];
  postCacheId: number;
}

const useCommentInput = ({ postId, groupId, postCacheId }: CommentInputParams) => {
  const queryClient = useQueryClient();

  const { user } = useUser();

  const mutation = useMutation({
    mutationFn: (content: string) => createComment(content, postId, user?.id as string),
    onMutate: async (newContent) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });

      const previousComments = queryClient.getQueryData(['comments', postId]);
      const previousPosts = queryClient.getQueryData(['posts', groupId, '']);

      queryClient.setQueryData(['comments', postId], (old: CommentsType[]) => [
        ...old,
        {
          content: newContent,
          post_id: postId,
          user_id: user?.id,
          created_at: new Date().toISOString(),
          users: {
            id: user?.id,
            nickname: user?.user_metadata?.nickname,
            profile_image: user?.user_metadata?.profile_image,
          },
        },
      ]);

      queryClient.setQueryData<InfiniteData<PostCacheListType[]>>(['posts', groupId, ''], (oldData) => {
        if (!oldData) return oldData;

        const newData = oldData?.pages.map((posts) => {
          return posts?.map((post) => {
            if (post.postCacheId === postCacheId)
              return { ...post, comments: { ...post.comments, count: post.comments.count + 1 } };
            return post;
          });
        });

        return {
          ...oldData,
          pages: newData,
        };
      });

      return { previousComments, previousPosts };
    },
    onError: (_err, _newContent, context) => {
      queryClient.setQueryData(['comments', postId], context?.previousComments);
      queryClient.setQueryData(['posts', groupId, ''], context?.previousPosts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  return mutation;
};

export default useCommentInput;
