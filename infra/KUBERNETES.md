# Kubernetes (k8s) & Helm Deployment Architecture Strategy

> **Production Deployment Readiness Strategy**: Kubernetes manifest generation is reserved for after the core application stack (`api`, `ai-gateway`, `worker`) completes stability and integration phases.

## Target Kubernetes Architecture Specifications

When deploying to Kubernetes environments (e.g. Google Kubernetes Engine - GKE), manifests should be structured under `infra/k8s/` or managed via Helm charts (`infra/helm/`):

### 1. Target Microservice Deployments
- **`shikkhok-api`**: Primary REST API monolith deployment with HPA scaling.
- **`shikkhok-ai-gateway`**: AI LLM streaming gateway with SSE connection limits.
- **`shikkhok-worker`**: Asynchronous BullMQ background worker deployment.

### 2. Standard Manifest Components per Service
For each microservice deployment, the following Kubernetes resources must be defined:

```yaml
# Target Manifest Manifest Template Blueprint (infra/k8s/api.yaml)

apiVersion: apps/v1
kind: Deployment
metadata:
  name: shikkhok-api
  namespace: shikkhok-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: shikkhok-api
  template:
    metadata:
      labels:
        app: shikkhok-api
    spec:
      containers:
        - name: api
          image: gcr.io/shikkhok-ai/api:v1.0.0
          ports:
            - containerPort: 4000
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1024Mi"
          readinessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 15
            periodSeconds: 20
          envFrom:
            - configMapRef:
                name: shikkhok-api-config
            - secretRef:
                name: shikkhok-api-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: shikkhok-api-service
spec:
  type: ClusterIP
  ports:
    - port: 4000
      targetPort: 4000
  selector:
    app: shikkhok-api
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: shikkhok-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: shikkhok-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 75
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: shikkhok-api-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: shikkhok-api
```

### 3. Ingress & Helm Package Strategy
- **Ingress Controller**: NGINX or Google Cloud HTTP(S) Load Balancer terminating TLS certificates and routing `/api/v1/*` to `shikkhok-api-service` and `/ai/v1/*` to `shikkhok-ai-gateway-service`.
- **Helm**: Use Helm (`infra/helm/shikkhok-chart`) once staging and production environments exist to parametrize domain names, database replica URLs, and scaling thresholds across environments.
