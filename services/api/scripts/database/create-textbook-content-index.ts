import mongoose from 'mongoose';

const collectionName = 'textbooks';
const indexName = 'uq_textbook_content_scope';

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required to create the textbook content index');

  await mongoose.connect(uri);
  try {
    const collection = mongoose.connection.collection(collectionName);
    const duplicates = await collection
      .aggregate<{ _id: unknown; count: number }>([
        {
          $match: {
            checksumSha256: { $type: 'string', $gt: '' },
          },
        },
        {
          $group: {
            _id: {
              checksumSha256: '$checksumSha256',
              subjectId: '$subjectId',
              curriculumVersion: { $ifNull: ['$curriculumVersion', null] },
            },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $limit: 20 },
      ])
      .toArray();

    if (duplicates.length) {
      throw new Error(
        `Cannot create ${indexName}: duplicate textbook content/scope records exist. ` +
          `Resolve these records, then rerun. Sample: ${JSON.stringify(duplicates)}`,
      );
    }

    await collection.createIndex(
      { checksumSha256: 1, subjectId: 1, curriculumVersion: 1 },
      {
        unique: true,
        name: indexName,
        partialFilterExpression: { checksumSha256: { $type: 'string', $gt: '' } },
      },
    );
    console.log(`Ensured ${indexName} on ${collectionName}.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Textbook index setup failed');
  process.exitCode = 1;
});
