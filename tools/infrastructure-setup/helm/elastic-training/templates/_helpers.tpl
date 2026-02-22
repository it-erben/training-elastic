{{/*
Chart full name.
*/}}
{{- define "elastic-training.fullname" -}}
{{- .Release.Name }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "elastic-training.labels" -}}
app.kubernetes.io/name: {{ include "elastic-training.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "elastic-training.selectorLabels" -}}
app.kubernetes.io/name: {{ include "elastic-training.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Generate a 32-character encryption key if not provided.
*/}}
{{- define "elastic-training.encryptionKey" -}}
{{- if .Values.encryptionKey }}
{{- .Values.encryptionKey }}
{{- else }}
{{- randAlphaNum 32 }}
{{- end }}
{{- end }}
