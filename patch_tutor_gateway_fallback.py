with open("services/api/src/modules/tutor/tutor-gateway.service.ts", "r") as f:
    text = f.read()

text = text.replace("if (chunk.data.fallbackUsed) {", "if (chunk.data.retrievalUnavailable) {")

with open("services/api/src/modules/tutor/tutor-gateway.service.ts", "w") as f:
    f.write(text)
