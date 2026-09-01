# Argo CD Deployment

Argo CD watches the Helm chart in Git. Helm remains responsible for templating; Argo CD is responsible for reconciliation and rollout.

## Bootstrap

Install Argo CD in the cluster, register this repository if it is private, create the runtime Secret in `shikkhok-production`, then apply the Application:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl create namespace shikkhok-production
# Populate this from your secret manager or a local, untracked env file.
kubectl -n shikkhok-production create secret generic shikkhok-ai-secrets \
  --from-env-file=infra/kubernetes/helm/shikkhok-ai/examples/secret.env
kubectl apply -f infra/argocd/shikkhok-ai-production.yaml
```

The example Secret file contains placeholders only. Replace them with real values through a secret manager or a sealed/encrypted Secret workflow; do not commit credentials.

## Verification

```bash
argocd app get shikkhok-ai-production
argocd app wait shikkhok-ai-production --health --sync
kubectl -n shikkhok-production get pods,svc,ingress
```

The Application uses `main`, enables automated sync, prunes removed resources, self-heals drift, and creates the target namespace. Update image tags and infrastructure CIDRs in a reviewed Git change; Argo CD will reconcile that change automatically.
