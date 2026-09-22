with open("services/api/src/modules/tutor/tutor-gateway.service.ts", "r") as f:
    text = f.read()

text = text.replace("fallbackUsed: boolean;", "grounded: boolean;\n  retrievalUnavailable: boolean;")
text = text.replace("let fallbackUsed = false;", "let grounded = true;\n    let retrievalUnavailable = false;")
text = text.replace("fallbackUsed = true;", "grounded = false;\n            retrievalUnavailable = true;")
text = text.replace("fallbackUsed,", "grounded,\n        retrievalUnavailable,")

with open("services/api/src/modules/tutor/tutor-gateway.service.ts", "w") as f:
    f.write(text)

with open("services/api/src/modules/tutor/tests/tutor.service.spec.ts", "r") as f:
    text = f.read()

text = text.replace("fallbackUsed: false,", "grounded: true,\n      retrievalUnavailable: false,")
text = text.replace("fallbackUsed: true,", "grounded: false,\n      retrievalUnavailable: true,")

with open("services/api/src/modules/tutor/tests/tutor.service.spec.ts", "w") as f:
    f.write(text)
