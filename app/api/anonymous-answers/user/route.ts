import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import mongoose from 'mongoose';

const AnonymousAnswerSchema = new mongoose.Schema({
  questionPublicId: { type: String, required: true },
  answer: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const AnonymousQuestionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  question: { type: String, required: true },
  publicId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const AnonymousAnswer = mongoose.models.AnonymousAnswer || mongoose.model('AnonymousAnswer', AnonymousAnswerSchema);
const AnonymousQuestion = mongoose.models.AnonymousQuestion || mongoose.model('AnonymousQuestion', AnonymousQuestionSchema);

// GET - Get all answers for current user's questions
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Get all user's questions
    const questions = await AnonymousQuestion.find({ userId: user.id });
    const publicIds = questions.map(q => q.publicId);
    
    // Get all answers for these questions
    const answers = await AnonymousAnswer.find({ questionPublicId: { $in: publicIds } })
      .sort({ createdAt: -1 });
    
    // Group answers by question
    const answersByQuestion: Record<string, any> = {};
    for (const answer of answers) {
      if (!answersByQuestion[answer.questionPublicId]) {
        const question = questions.find(q => q.publicId === answer.questionPublicId);
        answersByQuestion[answer.questionPublicId] = {
          question: question?.question || 'Unknown question',
          publicId: answer.questionPublicId,
          answers: []
        };
      }
      answersByQuestion[answer.questionPublicId].answers.push({
        answer: answer.answer,
        createdAt: answer.createdAt
      });
    }
    
    return NextResponse.json({ answersByQuestion: Object.values(answersByQuestion) });
  } catch (error) {
    console.error('Error fetching anonymous answers:', error);
    return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
  }
}
