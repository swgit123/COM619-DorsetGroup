[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=swgit123_COM619-DorsetGroup&metric=alert_status&token=f9df53fcfedb23f55f95f3e41fc6d417f6051342)](https://sonarcloud.io/summary/new_code?id=swgit123_COM619-DorsetGroup)


# Table of Contents

- [Infrastructure](#infrastructure)
- [CouchDB](#couchdb)
- [Front End](#front-end)
- [Back End](#back-end)
- [GitHub Actions](#github-actions)
- [Pre Commits](#pre-commits)

## Infrastructure

![Infrastructure Diagram](infrastructure.drawio.svg)

The infrastructure is deployed on AWS using EKS, with CouchDB for data storage and an Application Load Balancer for HTTPS traffic routing via Route53.

### Route53

AWS Route53 provides DNS management for the application. It creates a CNAME record pointing to the Application Load Balancer, enabling access via a custom domain (recipeshare.com619.v2xinterconnect.com). ACM certificate validation records are also managed through Route53.

### Application Load Balancer (ALB)

The ALB handles incoming HTTPS traffic on port 443 and HTTP traffic on port 80 (with automatic SSL redirect). It's provisioned by the AWS Load Balancer Controller running in the EKS cluster and uses an ACM certificate for SSL/TLS termination. The Ingress resource routes traffic to the com619-service.

### VPC (Virtual Private Cloud)

A custom VPC (192.168.0.0/16) provides network isolation with:

- 2 Public Subnets (192.168.0.0/18, 192.168.64.0/18) across different availability zones
- 2 Private Subnets (192.168.128.0/18, 192.168.192.0/18) for EKS worker nodes
- Internet Gateway for public subnet internet access
- 2 NAT Gateways (one per AZ) with Elastic IPs for private subnet outbound traffic
- Route tables managing traffic flow between subnets

The VPC is based on AWS' suggested VPC Stack see, [VPC for EKS Cluster | AWS EKS](https://docs.aws.amazon.com/eks/latest/userguide/creating-a-vpc.html).

### EKS Cluster

Amazon EKS (Elastic Kubernetes Service) orchestrates containerized applications with:

- Cluster control plane managed by AWS
- Node group with 2-4 t2.medium Bottlerocket instances
- EKS add-ons: CoreDNS, kube-proxy, aws-ebs-csi-driver
- OIDC provider for IAM role integration

### ECR (Elastic Container Registry)

Stores Docker images for the frontend application. The deployment pipeline builds images locally, authenticates with ECR, and pushes tagged images (com619app:latest). The EKS cluster pulls images using an ecr-registry-secret.

### Application Deployment

Kubernetes Deployment running the Next.js frontend application:

- 1 replica pulling from ECR
- Exposed via NodePort service (com619-service) on port 3000
- Resource limits: 500m CPU, 512Mi memory
- Connects to CouchDB for data persistence

### CouchDB StatefulSet

A 3-node CouchDB cluster for distributed data storage:

- StatefulSet with pods: couchdb-0, couchdb-1, couchdb-2
- Headless service for inter-pod communication
- Each pod has persistent storage via EBS volumes (1Gi gp2)
- Credentials: admin/password (configured via environment variables)

### EBS (Elastic Block Store)

Provides persistent storage for CouchDB pods through PersistentVolumeClaims. Each CouchDB pod has a dedicated 1Gi gp2 volume mounted at /opt/couchdb/data, ensuring data survives pod restarts.

### IAM Roles

Two primary IAM roles secure the infrastructure:

- **EKS Cluster Role**: Grants permissions for cluster management (AmazonEKSClusterPolicy)
- **EKS Node Role**: Allows worker nodes to pull images from ECR, manage networking (CNI), and attach EBS volumes (AmazonEKSWorkerNodePolicy, AmazonEC2ContainerRegistryReadOnly, AmazonEKS_CNI_Policy, AmazonEBSCSIDriverPolicy)
- **Load Balancer Controller Policy**: Enables the ALB controller to manage AWS load balancers and security groups

## CouchDB

CouchDB is a NoSQL document database that stores data as JSON documents with a RESTful HTTP API. The application uses CouchDB 3.3 deployed as a 3-node cluster in Kubernetes for high availability and data replication.

#### Deployment Architecture

CouchDB runs as a StatefulSet with three pods (couchdb-0, couchdb-1, couchdb-2) managed by Kubernetes. Each pod:

- Uses the official couchdb:3.3 Docker image
- Has persistent storage via EBS-backed PersistentVolumeClaims (1Gi gp2 volumes)
- Mounts data at /opt/couchdb/data for durability across restarts
- Communicates through a headless service on port 5984

#### Authentication & Configuration

A default CouchDB setup is deployed with the following credentials:

- Username: `admin`
- Password: `password`
- Node names set via `COUCHDB_NODENAME` environment variable using pod metadata

Deployment uses different deployment credentials for security.

#### Data Storage

CouchDB stores recipe and ingredient data as JSON documents. The setup script (`setup_couchdb.py`) initializes the `recipes` database and populates it with data from JSON files using CouchDB's HTTP API.

#### Clustering

CouchDB's built-in clustering provides automatic data replication and distribution across the three nodes, ensuring high availability and fault tolerance. See [CouchDB Cluster Setup](https://docs.couchdb.org/en/stable/setup/cluster.html) for more details on clustering architecture.

#### Sample CouchDB setup

To run disaster case tests without affecting production deployment/cluster CouchDB can be deployed on a local cluster using minikube.

Prerequesits:

- docker installed
- kubectl installed

**Install Minikube:**

Follow the official installation guide for your OS: [Minikube Installation](https://minikube.sigs.k8s.io/docs/start/)

**Start Minikube:**

```bash
minikube start
```

**Deploy CouchDB:**

```bash
kubectl apply -f CouchDB/couchdb-example.yaml
```

**Port Forward to Access CouchDB:**

```bash
kubectl port-forward svc/couchdb 5984:5984
```

CouchDB will be accessible at `http://localhost:5984`

From there CouchDB API will also be accessable at localhost:5984. This allows for python requests to be used to interact with the database.

## Front End

Front End

The frontend is a single-page application built with React and Next.js, using TypeScript and Tailwind utility classes for styling. It runs as a containerised service within the EKS cluster and is exposed via the Application Load Balancer.

The application uses a client-side routed App component ("use client") to switch between core views (Home, Upload, Favourites, Authentication, and Settings) without full page reloads.

Key Features

Role-based UI behaviour
- Guests can browse and search public recipes.
- Authenticated users can like recipes, save favourites, upload new recipes, and manage their account.
- Authentication state is held in React state and controls routing and navigation visibility.

Recipe browsing
- Recipes are displayed as cards with image, title, author, and actions.
- A modal view shows full recipe details including ingredients and step-by-step instructions.
- Search filtering is handled client-side using useState and useMemo.

Ingredient picker
- Interactive ingredient search with suggestion pills.
- Quantity and unit selection per ingredient.
- Ingredient suggestions are fetched via a Next.js API route (/api/ingredients), keeping third-party API keys server-side.

Account management
- Users can update their profile picture, username, and password via the Settings view.
- Changes are applied through authenticated backend API requests.

Styling and UX
- A small internal design token object centralises common styles (buttons, cards, inputs).
- Responsive layout using flexbox and grid utilities.
- Micro-interactions such as filled icons for likes/favourites and animated ingredient pills provide immediate visual feedback.

Security and Dependencies
Frontend dependencies are pinned to known-safe versions. During development, a React/Next.js security advisory was identified and mitigated by upgrading to patched releases and redeploying the frontend container, ensuring no vulnerable versions were exposed in production.






## Back End

The back end is a python file server.py with custom routes/endpoints.

The backend runs on port 5000 and can be accessed internally on the deployment pod via localhost:5000. The backend and front end are deployed together inside the same k8s pod. This allows for easy access via couchdb:5984 for the database and localhost:5000 for the back end logic.

## GitHub Actions

Description for GitHub Actions goes here.

## Pre Commits

The project uses Husky to manage Git hooks for automated code quality checks. Pre-commit hooks run automatically before each commit to ensure code standards are maintained across the codebase.
