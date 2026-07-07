'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Copy, Trash2, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { getCurrentUserFromSession, clearCurrentUserSession } from '@/lib/client-auth';
import { AnonymousAnswers } from '../../components/AnonymousAnswers';
import { cn } from '@/lib/utils';

interface AnonymousQuestion {
  _id: string;
  question: string;
  publicId: string;
  createdAt: Date;
  isActive: boolean;
}

export default function AnonymousPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [questions, setQuestions] = useState<AnonymousQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');

  useEffect(() => {
    const user = getCurrentUserFromSession();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadQuestions();
  }, [router]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/anonymous-questions');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      const response = await fetch('/api/anonymous-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion }),
      });

      if (response.ok) {
        setNewQuestion('');
        loadQuestions();
      }
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };

  const deleteQuestion = async (publicId: string) => {
    try {
      const response = await fetch(`/api/anonymous-questions?publicId=${publicId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const copyLink = (publicId: string) => {
    const link = `${window.location.origin}/anonymous/answer/${publicId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(publicId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = () => {
    clearCurrentUserSession();
    router.push('/login');
  };

  if (!currentUser) {
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
    <div className="flex h-screen bg-[#faf8f5] overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>

      {/* Sidebar */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-r border-[#c7b793]/15 flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="p-4 border-b border-[#c7b793]/15 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Anonymous Q&A</h1>
              <p className="text-xs text-[#a38c5b] font-medium mt-0.5">
                {questions.length} active {questions.length === 1 ? 'question' : 'questions'}
              </p>
            </div>
            <div className="flex items-center space-x-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/personal-chat')}
                className="text-gray-400 hover:text-gray-600 rounded-full h-9 w-9 flex items-center justify-center"
                title="Back to Chat"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50/50 rounded-full h-9 w-9 flex items-center justify-center"
                title="Sign out"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>

          {/* IMPORTANT: Tab Switcher for Questions and Answers */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={activeTab === 'questions' ? 'default' : 'outline'}
              onClick={() => setActiveTab('questions')}
              className={cn(
                "flex-1 rounded-full text-sm font-medium",
                activeTab === 'questions' ? 'bg-[#c7b793] text-white hover:bg-[#b8a57e]' : 'border-[#c7b793]/30 text-gray-600 hover:bg-[#c7b793]/10'
              )}
            >
              Questions
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'answers' ? 'default' : 'outline'}
              onClick={() => setActiveTab('answers')}
              className={cn(
                "flex-1 rounded-full text-sm font-medium",
                activeTab === 'answers' ? 'bg-[#c7b793] text-white hover:bg-[#b8a57e]' : 'border-[#c7b793]/30 text-gray-600 hover:bg-[#c7b793]/10'
              )}
            >
              Answers
            </Button>
          </div>

          {/* Create Question Form - only show in Questions tab */}
          {activeTab === 'questions' && (
            <form onSubmit={createQuestion} className="space-y-2">
              <Input
                placeholder="Ask a question for anonymous answers..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="bg-[#faf8f5] border-transparent rounded-full focus:bg-white focus:border-[#c7b793]/40 focus:ring-[#c7b793]/10 text-sm h-9 text-gray-800 placeholder-gray-400"
              />
              <Button
                type="submit"
                disabled={!newQuestion.trim()}
                className="w-full bg-[#c7b793] hover:bg-[#b8a57e] text-white rounded-full h-9 text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Question
              </Button>
            </form>
          )}
        </div>

        {/* IMPORTANT: Show Questions List or Answers based on active tab */}
        <ScrollArea className="flex-1 bg-white">
          {activeTab === 'questions' ? (
            // Questions Tab Content
            <>
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c7b793]"></div>
                </div>
              ) : questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                  <div className="w-14 h-14 bg-[#faf8f5] border border-[#c7b793]/15 rounded-full flex items-center justify-center mb-3">
                    <LinkIcon className="h-7 w-7 text-[#c7b793]/70" />
                  </div>
                  <p className="text-gray-700 font-semibold text-sm">No questions yet</p>
                  <p className="text-gray-400 text-xs mt-1 px-4">
                    Create a question above to start receiving anonymous answers
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100/50">
                  {questions.map((question) => (
                    <div key={question._id} className="p-4 hover:bg-[#faf8f5]/80 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            {question.question}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyLink(question.publicId)}
                              className="h-7 px-2 text-xs border-[#c7b793]/30 text-gray-600 hover:bg-[#c7b793]/10"
                            >
                              {copiedId === question.publicId ? (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy Link
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteQuestion(question.publicId)}
                          className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Answers Tab Content - Show AnonymousAnswers component
            <div className="p-4">
              <AnonymousAnswers currentUser={currentUser} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Content - Answers */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-gradient-to-br from-white to-[#faf8f5]">
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 bg-[#faf8f5] border border-[#c7b793]/20 rounded-full flex items-center justify-center mb-6 mx-auto shadow-sm">
              <LinkIcon className="h-10 w-10 text-[#c7b793]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-2">
              Anonymous Answers
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              View anonymous answers to your questions in the chat section. Check your personal chat for the anonymous messages tab.
            </p>
            <Button
              onClick={() => router.push('/personal-chat')}
              className="bg-[#c7b793] hover:bg-[#b8a57e] text-white rounded-full"
            >
              Go to Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
