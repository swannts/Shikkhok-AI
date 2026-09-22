import re

with open("services/api/src/modules/tutor/tutor.service.ts", "r") as f:
    text = f.read()

# Remove the citation pushing logic in prepareContext
pattern = r'        citations\.push\(\{\n          sourceId: conversation\.lessonId\.toString\(\),\n          sourceBook: \'curriculum-context\',\n          classLevel: conversation\.classLevel,\n          subject: subjectTitle,\n          chapter: chapter\.title,\n          excerpt: lesson\.title,\n        \}\);\n'
text = re.sub(pattern, '', text)

with open("services/api/src/modules/tutor/tutor.service.ts", "w") as f:
    f.write(text)
