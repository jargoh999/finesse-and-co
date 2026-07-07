'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnonymousAnswerPage({ params }: { params: Promise<{ publicId: string }> }) {
  const router = useRouter();
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [publicId, setPublicId] = useState<string>('');

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setPublicId(resolvedParams.publicId);
      
      // In a real app, you'd fetch the question details here
      // For now, we'll just show the form
      setQuestion('Loading question...');
      
      // Simulate loading
      setTimeout(() => {
        setQuestion('What would you like to know?');
        setIsLoading(false);
      }, 500);
    };
    
    loadParams();
  }, [params]);

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/anonymous-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId, answer: answer.trim() }),
      });

      if (response.ok) {
        setSuccess(true);
        setAnswer('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit answer');
      }
    } catch (error) {
      setError('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#faf8f5]" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c7b793] mx-auto mb-4"></div>
          <p className="text-[#a38c5b] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-[#c7b793]/15 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#faf8f5] border border-[#c7b793]/20 rounded-full flex items-center justify-center mb-4 mx-auto">
              <MessageCircle className="h-8 w-8 text-[#c7b793]" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
              Anonymous Answer
            </h1>
            <p className="text-sm text-gray-500">
              Your response will be sent anonymously
            </p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Send className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Answer Submitted!
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Your anonymous response has been sent successfully.
              </p>
              <Button
                onClick={() => {
                  setSuccess(false);
                  setAnswer('');
                }}
                className="bg-[#c7b793] hover:bg-[#b8a57e] text-white rounded-full"
              >
                Submit Another Answer
              </Button>
            </div>
          ) : (
            <>
              {/* Question Display */}
              <div className="bg-[#faf8f5] rounded-xl p-4 mb-6 border border-[#c7b793]/10">
                <p className="text-sm text-[#a38c5b] font-medium mb-2">Question:</p>
                <p className="text-base text-gray-900 font-medium">
                  {question}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Answer Form */}
              <form onSubmit={submitAnswer} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Your Answer
                  </label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your anonymous answer here..."
                    className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#c7b793] focus:ring-2 focus:ring-[#c7b793]/10 transition-all duration-200 text-sm text-gray-800 placeholder-gray-400 resize-none"
                    maxLength={500}
                  />
                  <div className="flex justify-between mt-1.5">
                    <p className="text-xs text-gray-400">
                      Your identity will remain anonymous
                    </p>
                    <p className="text-xs text-gray-400">
                      {answer.length}/500
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!answer.trim() || isSubmitting}
                  className="w-full bg-[#c7b793] hover:bg-[#b8a57e] text-white rounded-full h-11 text-sm font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Answer
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
      
        </p>
      </div>
    </div>
  );
}
