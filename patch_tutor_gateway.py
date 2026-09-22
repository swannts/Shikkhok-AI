import re

with open("services/api/src/modules/tutor/tutor-gateway.service.ts", "r") as f:
    text = f.read()

# Fix fallbackUsed -> grounded & retrievalUnavailable
text = text.replace(
    "fallbackUsed: true,",
    "grounded: false,\n        retrievalUnavailable: true,"
)

citation_block = """    if (request.lessonId) {
      const citation: TutorCitation = {
        sourceId: request.lessonId,
        sourceBook: `NCTB Class ${request.classLevel} ${request.subject ?? 'Textbook'}`,
        classLevel: request.classLevel,
        subject: request.subject,
        excerpt: 'এনসিটিবি পাঠ্যক্রম ভিত্তিক মূল শিক্ষণীয় বিষয়সমূহ।',
      };
      yield {
        event: 'citation',
        data: citation,
      };
    }"""
text = text.replace(citation_block, "")

new_sentences_block = """    const sentences = [
      'এই উত্তরটি সাধারণ ব্যাখ্যার ভিত্তিতে দেওয়া হয়েছে। ',
      'এই মুহূর্তে পাঠ্যবইয়ের উৎস যাচাই করা যাচ্ছে না। ',
      request.contextSegments?.length ? `${request.contextSegments.join(' • ')}। ` : '',
      `তোমার প্রশ্নের মূল ধারণা: "${request.prompt.trim()}"। `,
      'কোনো নির্দিষ্ট অংশ বুঝতে না পারলে আমাকে নির্দ্বিধায় বলো!',
    ];"""

text = re.sub(r'    const sentences = \[[\s\S]*?\];', new_sentences_block, text)

text = text.replace("fallbackUsed: boolean;", "grounded: boolean;\n  retrievalUnavailable: boolean;")
text = text.replace("let fallbackUsed = false;", "let grounded = true;\n    let retrievalUnavailable = false;")
text = text.replace("fallbackUsed = true;", "grounded = false;\n            retrievalUnavailable = true;")
text = text.replace("fallbackUsed,", "grounded,\n        retrievalUnavailable,")

# Remove duplicate logFailure
duplicate_log = """
  private logFailure(request: any, endpoint: URL | string, startedAt: number, type: string, status?: number, error?: any) {
    this.logger.error(`AI Gateway Error [${type}] to ${endpoint}: ${error?.message || status}`);
  }"""

text = text.replace(duplicate_log + "\n" + duplicate_log, duplicate_log)

with open("services/api/src/modules/tutor/tutor-gateway.service.ts", "w") as f:
    f.write(text)

with open("services/api/src/modules/tutor/tests/tutor.service.spec.ts", "r") as f:
    text = f.read()

text = text.replace("fallbackUsed: false,", "grounded: true,\n      retrievalUnavailable: false,")
text = text.replace("fallbackUsed: true,", "grounded: false,\n      retrievalUnavailable: true,")

with open("services/api/src/modules/tutor/tests/tutor.service.spec.ts", "w") as f:
    f.write(text)
