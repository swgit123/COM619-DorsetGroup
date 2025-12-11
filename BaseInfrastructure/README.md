# BaseInfrastructure Deployment

This directory contains the infrastructure-as-code for deploying the application on AWS EKS with CouchDB.

## Prerequisites

- AWS CLI configured with appropriate credentials
- kubectl installed
- eksctl installed
- helm installed
- Docker installed
- jq installed

## Configuration

Edit the Makefile variables:

- `COM619_STACK_NAME`: CloudFormation stack prefix (default: COM619)
- `DEPLOYMENT_NAMESPACE`: Deployment namespace tag
- `ROOT_HOSTEDZONE`: Route53 hosted zone ID
- `COM619_SERVICE_NAME`: Service subdomain name (default: recipeshare)

## Deployment Commands

### Full Infrastructure Deployment

```bash
make deployAll
```

Deploys the complete infrastructure:

1. Sets up domain names from Route53
2. Deploys VPC with subnets, NAT gateways, and route tables
3. Deploys EKS cluster with node group
4. Configures kubectl to connect to the cluster

### HTTPS Setup

**One-time setup (run once):**

```bash
make setupALBPolicy
```

**Deploy HTTPS with ALB:**

```bash
make deployHTTPS
```

This will:

1. Request ACM certificate and validate via Route53
2. Enable OIDC provider for IAM roles
3. Install AWS Load Balancer Controller via Helm
4. Deploy Ingress resource with SSL/TLS termination
5. Create Route53 CNAME record pointing to ALB

### Application Deployment

**Build and push Docker image to ECR:**

```bash
make buildApp
```

**Deploy application to Kubernetes:**

```bash
make deployApp
```

Creates ECR pull secret and deploys the application.

**Update running application:**

```bash
make updateApp
```

Rebuilds the image and triggers a rolling restart.

### CouchDB Deployment

```bash
make deployCouchDB
```

Deploys the 3-node CouchDB StatefulSet with persistent storage.

## Teardown Commands

**Remove application:**

```bash
make undeployApp
```

**Remove entire infrastructure:**

```bash
make undeployAll
```

Deletes the EKS cluster and VPC (waits for completion).

## Files

- `Makefile`: Deployment automation
- `EKSCluster.yaml`: EKS cluster and node group CloudFormation template
- `com619Domain.yaml`: VPC and networking CloudFormation template
- `com619Deployment.yaml`: Kubernetes application deployment manifest
- `couchdb.yaml`: CouchDB StatefulSet manifest
- `Ingress.yaml.template`: Ingress template for ALB
- `setup-alb-policy.sh`: Creates IAM policy for ALB controller
- `setupACMCert.sh`: Requests and validates ACM certificate

## Deployment Flow

1. `make setupALBPolicy` (one-time)
2. `make deployAll`
3. `make deployCouchDB`
4. `make buildApp`
5. `make deployApp`
6. `make deployHTTPS`

Access the application at: `https://recipeshare.com619.v2xinterconnect.com`
