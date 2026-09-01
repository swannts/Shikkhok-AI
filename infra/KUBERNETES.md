# Kubernetes (k8s) & Helm Deployment Architecture Strategy

> **Production Deployment Strategy**: The production Helm chart is implemented under `infra/kubernetes/helm/shikkhok-ai`. It deploys stateless workloads and expects managed MongoDB and Redis credentials through a Kubernetes Secret.

## Target Kubernetes Architecture Specifications

When deploying to Kubernetes environments (e.g. Google Kubernetes Engine - GKE), use the Helm chart at `infra/kubernetes/helm/shikkhok-ai`:

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
- **Helm**: The chart parametrizes image tags, domains, scaling thresholds, health probes, and managed-database Secret references across environments.

## Deployment Checklist

1. Create the `secrets.existingSecret` Secret in the target namespace using the example contract under `infra/kubernetes/helm/shikkhok-ai/examples/`.
2. Pin immutable image tags in an environment values file. Do not deploy `latest` to production.
3. Install ingress-nginx and cert-manager, including the `letsencrypt-prod` ClusterIssuer.
4. Validate and install with `helm lint`, `helm template`, and `helm upgrade --install`.
