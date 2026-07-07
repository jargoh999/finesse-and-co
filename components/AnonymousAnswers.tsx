'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Clock } from 'lucide-react';
import { format } from 'date-fns/format';
import { cn } from '@/lib/utils';

interface AnswerGroup {
  question: string;
  publicId: string;
  answers: {
    answer: string;
    createdAt: Date;
  }[];
}

interface AnonymousAnswersProps {
  currentUser: any;
}

export function AnonymousAnswers({ currentUser }: AnonymousAnswersProps) {
  const [answersByQuestion, setAnswersByQuestion] = useState<AnswerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnswers();
  }, [currentUser]);

  const loadAnswers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/anonymous-answers/user');
      if (response.ok) {
        const data = await response.json();
        setAnswersByQuestion(data.answersByQuestion || []);
      }
    } catch (error) {
      console.error('Error loading anonymous answers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c7b793]"></div>
      </div>
    );
  }

  if (answersByQuestion.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center p-6">
        <div className="w-14 h-14 bg-[#faf8f5] border border-[#c7b793]/15 rounded-full flex items-center justify-center mb-3">
          <MessageCircle className="h-7 w-7 text-[#c7b793]/70" />
        </div>
        <p className="text-gray-700 font-semibold text-sm">No anonymous answers</p>
        <p className="text-gray-400 text-xs mt-1 px-4">
          Create questions to receive anonymous answers
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100/50">
      {answersByQuestion.map((group) => (
        <div key={group.publicId} className="p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {group.question}
            </p>
            <p className="text-xs text-[#a38c5b]">
              {group.answers.length} {group.answers.length === 1 ? 'answer' : 'answers'}
            </p>
          </div>
          <div className="space-y-2">
            {group.answers.map((answer, index) => (
              <div
                key={index}
                className="bg-[#faf8f5] rounded-lg p-3 border border-[#c7b793]/10"
              >
                <p className="text-sm text-gray-800 mb-2">
                  {answer.answer}
                </p>
                <div className="flex items-center text-xs text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(answer.createdAt), 'MMM d, h:mm a')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
