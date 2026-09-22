import re

with open("services/api/src/modules/tutor/tutor-gateway.service.ts", "r") as f:
    text = f.read()

# Add logFailure method
logFailure_method = """
  private logFailure(request: any, endpoint: string, startedAt: number, type: string, status?: number, error?: any) {
    this.logger.error(`AI Gateway Error [${type}] to ${endpoint}: ${error?.message || status}`);
  }
}
"""
text = text.replace("}\n}", "}\n" + logFailure_method)

with open("services/api/src/modules/tutor/tutor-gateway.service.ts", "w") as f:
    f.write(text)
