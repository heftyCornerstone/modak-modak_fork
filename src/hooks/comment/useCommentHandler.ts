import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import deleteComment from '@queries/group/comments/deleteComment';
import updateComment from '@queries/group/comments/updateComment';

import { CommentsType } from '@queries/group/comments/fetchComments';
import { PostCacheListType } from '@ts/postType';

const useCommentHandler = (commentId: string, postId: string, groupId: string, postCacheId: number) => {
  const queryClient = useQueryClient();

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });

      const previousComments = queryClient.getQueryData(['comments', postId]);
      const previousPosts = queryClient.getQueryData(['posts', groupId, '']);

      queryClient.setQueryData(['comments', postId], (old: CommentsType[]) =>
        old?.filter((comment) => comment.id !== commentId)
      );
      
      queryClient.setQueryData<InfiniteData<PostCacheListType[]>>(['posts', groupId, ''], (oldData) => {
        if (!oldData) {
          return oldData;
        }

        const newData = oldData?.pages.map((posts) => {
          return posts?.map((post) => {
            if (post.postCacheId === postCacheId)
              return { ...post, comments: { ...post.comments, count: post.comments.count - 1 } };
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
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['comments', postId], context?.previousComments);
      queryClient.setQueryData(['posts', groupId, ''], context?.previousPosts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: (newContent: string) => updateComment(newContent, commentId),
    onMutate: async (newContent) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });

      const previousComments = queryClient.getQueryData(['comments', postId]);

      queryClient.setQueryData(['comments', postId], (old: CommentsType[]) =>
        old?.map((comment) => (comment.id === commentId ? { ...comment, content: newContent } : comment))
      );

      return { previousComments };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['comments', postId], context?.previousComments);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  return { deleteCommentMutation, updateCommentMutation };
};

export default useCommentHandler;
