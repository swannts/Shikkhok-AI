import mongoose from 'mongoose';

type LegacyTutorCitation = Record<string, unknown>;
type LegacyTutorMessage = {
  role: string;
  content?: string;
  citations?: LegacyTutorCitation[] | null;
  provider?: string | null;
  tokenUsage?: Record<string, unknown> | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  userId?: string | mongoose.Types.ObjectId | null;
};

type LegacyTutorConversation = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  messages?: LegacyTutorMessage[] | null;
  messageCount?: number | null;
  lastMessageAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeCitations(citations: LegacyTutorCitation[] | null | undefined) {
  if (!Array.isArray(citations)) {
    return [];
  }

  return citations
    .map((citation) => ({
      sourceId: typeof citation.sourceId === 'string' ? citation.sourceId : undefined,
      sourceBook: typeof citation.sourceBook === 'string' ? citation.sourceBook : 'Unknown source',
      classLevel: typeof citation.classLevel === 'number' ? citation.classLevel : undefined,
      subject: typeof citation.subject === 'string' ? citation.subject : undefined,
      chapter: typeof citation.chapter === 'string' ? citation.chapter : undefined,
      pageNumber: typeof citation.pageNumber === 'number' ? citation.pageNumber : undefined,
      excerpt: typeof citation.excerpt === 'string' ? citation.excerpt : undefined,
      sourceUrl: typeof citation.sourceUrl === 'string' ? citation.sourceUrl : undefined,
    }))
    .filter((citation) => citation.sourceBook);
}

function normalizeTokenUsage(tokenUsage: Record<string, unknown> | null | undefined) {
  if (!tokenUsage) {
    return null;
  }

  const promptTokens = typeof tokenUsage.promptTokens === 'number' ? tokenUsage.promptTokens : undefined;
  const completionTokens =
    typeof tokenUsage.completionTokens === 'number' ? tokenUsage.completionTokens : undefined;
  const totalTokens = typeof tokenUsage.totalTokens === 'number' ? tokenUsage.totalTokens : undefined;

  if (promptTokens === undefined && completionTokens === undefined && totalTokens === undefined) {
    return null;
  }

  return {
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

async function main() {
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection is not ready');
  }

  const conversations = db.collection<LegacyTutorConversation>('tutor_conversations');
  const messages = db.collection('tutor_messages');

  const legacyConversations = await conversations
    .find({
      messages: { $exists: true, $type: 'array', $ne: [] },
    })
    .toArray();

  let migratedConversations = 0;
  let migratedMessages = 0;

  for (const conversation of legacyConversations) {
    const legacyMessages = Array.isArray(conversation.messages) ? conversation.messages : [];
    if (legacyMessages.length === 0) {
      await conversations.updateOne(
        { _id: conversation._id },
        {
          $unset: { messages: '' },
        },
      );
      continue;
    }

    const existingCount = await messages.countDocuments({ conversationId: conversation._id });
    if (existingCount > 0) {
      console.warn(
        `Skipping conversation ${conversation._id.toHexString()} because ${existingCount} tutor_messages already exist`,
      );
      continue;
    }

    const createdAtFallback = toDate(conversation.createdAt) ?? new Date();
    const updatedAtFallback = toDate(conversation.updatedAt) ?? createdAtFallback;
    const documents = legacyMessages.map((message) => {
      const createdAt = toDate(message.createdAt) ?? createdAtFallback;
      const updatedAt = toDate(message.updatedAt) ?? createdAt;

      return {
        conversationId: conversation._id,
        userId: message.userId ? new mongoose.Types.ObjectId(message.userId) : conversation.userId,
        role: message.role,
        content: typeof message.content === 'string' ? message.content : '',
        citations: normalizeCitations(message.citations),
        provider: typeof message.provider === 'string' ? message.provider : null,
        tokenUsage: normalizeTokenUsage(message.tokenUsage),
        createdAt,
        updatedAt,
      };
    });

    if (documents.length > 0) {
      await messages.insertMany(documents, { ordered: true });
    }

    const lastLegacyMessage = legacyMessages[legacyMessages.length - 1];
    const lastMessageAt =
      toDate(lastLegacyMessage.createdAt) ??
      toDate(conversation.lastMessageAt) ??
      updatedAtFallback;

    await conversations.updateOne(
      { _id: conversation._id },
      {
        $set: {
          messageCount: legacyMessages.length,
          lastMessageAt,
        },
        $unset: {
          messages: '',
        },
      },
    );

    migratedConversations += 1;
    migratedMessages += legacyMessages.length;
  }

  console.log(
    `Migrated ${migratedMessages} tutor messages across ${migratedConversations} conversations.`,
  );

  await mongoose.disconnect();
}

void main().catch(async (error) => {
  console.error('Tutor message migration failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    // Ignore disconnect failures during a failed migration.
  }
  process.exitCode = 1;
});
