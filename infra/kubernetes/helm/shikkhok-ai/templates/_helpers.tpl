{{- define "shikkhok-ai.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- define "shikkhok-ai.fullname" -}}
{{- if .Values.fullnameOverride -}}{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}{{- else -}}{{- printf "%s-%s" .Release.Name (include "shikkhok-ai.name" .) | trunc 63 | trimSuffix "-" -}}{{- end -}}
{{- end -}}
{{- define "shikkhok-ai.labels" -}}
app.kubernetes.io/name: {{ include "shikkhok-ai.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{- end -}}
{{- define "shikkhok-ai.selectorLabels" -}}
app.kubernetes.io/name: {{ include "shikkhok-ai.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
{{- define "shikkhok-ai.secretName" -}}
{{- required "secrets.existingSecret must name a Kubernetes Secret containing runtime credentials" .Values.secrets.existingSecret -}}
{{- end -}}
