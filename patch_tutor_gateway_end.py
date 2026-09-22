import os

with open("services/api/src/modules/tutor/tutor-gateway.service.ts", "r") as f:
    text = f.read()

append_text = """
    const sentences = [
      'এই উত্তরটি সাধারণ ব্যাখ্যার ভিত্তিতে দেওয়া হয়েছে। ',
      'এই মুহূর্তে পাঠ্যবইয়ের উৎস যাচাই করা যাচ্ছে না। ',
      request.contextSegments?.length ? `${request.contextSegments.join(' • ')}। ` : '',
      `তোমার প্রশ্নের মূল ধারণা: "${request.prompt.trim()}"। `,
      'কোনো নির্দিষ্ট অংশ বুঝতে না পারলে আমাকে নির্দ্বিধায় বলো!',
    ];

    for (const sentence of sentences) {
      if (!sentence) continue;
      yield {
        event: 'delta',
        data: { text: sentence },
      };
    }

    yield {
      event: 'done',
      data: {
        latencyMs: Date.now() - startedAt,
      },
    };
  }

  private mapCitation(source: any): TutorCitation {
    return {
      sourceId: source?.sourceId ?? source?.id ?? undefined,
      sourceBook: source?.sourceBook ?? source?.book ?? 'Unknown source',
      classLevel: this.extractClassLevel(source?.class),
      subject: source?.subject ?? undefined,
      chapter: source?.chapter ?? undefined,
      pageNumber: typeof source?.pageNumber === 'number' ? source.pageNumber : undefined,
      excerpt: source?.excerpt ?? source?.content ?? undefined,
      sourceUrl: source?.sourceUrl ?? undefined,
    };
  }

  private extractClassLevel(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }
}
"""

with open("services/api/src/modules/tutor/tutor-gateway.service.ts", "w") as f:
    f.write(text + append_text)
