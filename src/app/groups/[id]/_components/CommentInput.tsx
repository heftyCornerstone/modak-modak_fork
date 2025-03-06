'use client';

import { useParams } from 'next/navigation';

import { useRef } from 'react';

import Button from '@components/common/Button';

import useCommentHandler from '@hooks/comment/useCommentHandler';
import useCommentInput from '@hooks/comment/useCommentInput';

import useCommentValueStore from '@stores/useCommentValueStore';

interface CommentInputProps {
  postId: string;
  postCacheId: number;
}

const CommentInput = ({ postId, postCacheId }: CommentInputProps) => {
  const { id } = useParams();
  const groupId = Array.isArray(id) ? id[0] : id;

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const { checkModify, commentValue, commentId, setCommentValue, reset } = useCommentValueStore();

  const createMutation = useCommentInput({ postId, groupId, postCacheId });

  const { updateCommentMutation } = useCommentHandler(commentId || '', postId, groupId, postCacheId);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCommentValue(value);

    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;

      const maxHeight = 100;
      if (textAreaRef.current.scrollHeight > maxHeight) {
        textAreaRef.current.style.height = `${maxHeight}px`;
        textAreaRef.current.style.overflow = 'auto';
      } else {
        textAreaRef.current.style.overflow = 'hidden';
      }
    }
  };

  const handleSubmit = () => {
    if (!commentValue.trim()) return;

    if (checkModify && commentId) {
      updateCommentMutation.mutate(commentValue, {
        onSuccess: () => {
          reset();
          if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
          }
        },
      });
    } else {
      createMutation.mutate(commentValue, {
        onSuccess: () => {
          setCommentValue('');
          if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
          }
        },
      });
    }
  };

  return (
    <div className="min-h-[20%] relative z-10">
      <div className="w-[92%] bg-white absolute bottom-[25%] left-1/2 transform translate-x-[-50%] px-3 py-2 border rounded-lg h-auto flex items-center gap-2">
        <textarea
          rows={1}
          ref={textAreaRef}
          value={commentValue}
          onChange={handleInput}
          placeholder="댓글 추가..."
          className="overflow-hidden resize-none border-none outline-none max-h-[100px] w-[90%] min-h-6 h-6 text-sm"
        />
        <Button
          type="button"
          label="등록"
          onClick={handleSubmit}
          className={`w-[10%] text-sm font-semibold leading-[140%] ${
            commentValue ? '!bg-inherit text-sm !text-primary' : '!bg-inherit text-sm !text-gray-400'
          }`}
        />
      </div>
    </div>
  );
};

export default CommentInput;
