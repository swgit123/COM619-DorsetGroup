COM619_STACK_NAME := COM619
DEPLOYMENT_NAMESPACE := alex-university
ROOT_HOSTEDZONE := Z1RHXN9JVNRIMU
COM619_SERVICE_NAME:= recipeshare


deployCouchDB:
# by passing in a secret we can load in an env variable from console.
# This way only the person deploying will know the credentials. No secrets will be committed
	@kubectl create secret generic couchdb-credentials \
		--from-literal=username=$${COUCHDB_USER} \
		--from-literal=password=$${COUCHDB_PASSWORD} \
		--dry-run=client -o yaml | kubectl apply -f -
	@kubectl apply -f couchdb.yaml

undeployCouchDB:
	@kubectl delete -f couchdb.yaml --ignore-not-found

deployApp:
	# Create ECR pull secret
	@kubectl create secret docker-registry ecr-registry-secret \
		--docker-server=114788392298.dkr.ecr.eu-west-2.amazonaws.com \
		--docker-username=AWS \
		--docker-password=$$(aws ecr get-login-password --region eu-west-2) \
		--namespace=default || true
	@kubectl apply -f com619Deployment.yaml

updateApp: buildApp
	@kubectl rollout restart deployment com619-deployment
	@kubectl rollout status deployment com619-deployment

undeployApp:
	@kubectl delete -f com619Deployment.yaml --ignore-not-found

buildApp:
	# First we need to create the ECR or check if it exists
	@aws ecr create-repository --repository-name com619app --region eu-west-2 || true

	# Need to authenticate ourselves to ECR
	@aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin 114788392298.dkr.ecr.eu-west-2.amazonaws.com

	# now build image from root (includes frontend and backend)
	@cd .. && docker build -t com619app .
	@docker tag com619app:latest 114788392298.dkr.ecr.eu-west-2.amazonaws.com/com619app:latest
	@docker push 114788392298.dkr.ecr.eu-west-2.amazonaws.com/com619app:latest

setupDomains:
	# Get the top level domain name
	@aws route53 get-hosted-zone --id ${ROOT_HOSTEDZONE} | jq -r '.HostedZone.Name' | sed 's/.$$//' > rootDomainName

	# Get the full domain name for our deployment
	@echo "com619.`cat rootDomainName`" > fullDomainName

	# Get the full host name+ domain name
	@echo "${COM619_SERVICE_NAME}.`cat fullDomainName`" > fullHostDomainName

deployAll: setupDomains

	# get current certificate, we want to prevent us from hitting the letsencrypt limit
	# when doing dev deployments, this means we trigger on 60 days left
# 	@rm -f cert.pem

# 	@set -e ;\
# 	if ! python3 checkExpire.py "cerbot/archive/recipeshare/cert1.pem" ;\
# 	then \
# 		${MAKE} renewCert  ;\
# 	fi
# 	# and remove the cert if it exists
# 	@rm -f cert.pem


	# Deploy VPC/Subnets/Networking
	@aws cloudformation deploy --no-fail-on-empty-changeset --template-file com619Domain.yaml \
		--stack-name "${COM619_STACK_NAME}-VPC" \
		--capabilities CAPABILITY_NAMED_IAM \
		--tags "user:deployment=${DEPLOYMENT_NAMESPACE}" \
		--parameter-overrides \
		DeploymentNamespace="${DEPLOYMENT_NAMESPACE}" \
		DomainName="`cat rootDomainName`" \
		RootHostedZone="${ROOT_HOSTEDZONE}"

	# Deploy EKS Cluster
	@aws cloudformation deploy --no-fail-on-empty-changeset --template-file EKSCluster.yaml \
		--stack-name "${COM619_STACK_NAME}-CLUSTER" \
		--capabilities CAPABILITY_NAMED_IAM \
		--tags "user:deployment=${DEPLOYMENT_NAMESPACE}"

	# Configure kubectl
	@aws eks update-kubeconfig --name AlexCOM619-EKS-Cluster --region eu-west-2

	# Now that VPC & EKS is deployed we need to deploy our database

setupALBPolicy:
	@bash setup-alb-policy.sh

setupACMCert: setupDomains
	@bash setupACMCert.sh

deployHTTPS: setupDomains setupACMCert
	# Enable OIDC provider for IAM roles
	@eksctl utils associate-iam-oidc-provider --region=eu-west-2 --cluster=AlexCOM619-EKS-Cluster --approve

	# Install AWS Load Balancer Controller
	@kubectl apply -f https://raw.githubusercontent.com/aws/eks-charts/master/stable/aws-load-balancer-controller/crds/crds.yaml
	@eksctl create iamserviceaccount \
		--cluster=AlexCOM619-EKS-Cluster \
		--namespace=kube-system \
		--name=aws-load-balancer-controller \
		--attach-policy-arn=arn:aws:iam::114788392298:policy/AWSLoadBalancerControllerIAMPolicy \
		--approve \
		--override-existing-serviceaccounts
	@helm repo add eks https://aws.github.io/eks-charts || true
	@helm repo update
	@helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
		-n kube-system \
		--set clusterName=AlexCOM619-EKS-Cluster \
		--set serviceAccount.create=false \
		--set serviceAccount.name=aws-load-balancer-controller \
		--set region=eu-west-2 \
		--set vpcId=$$(aws cloudformation describe-stacks --stack-name COM619-VPC --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' --output text)

	# Wait for webhook to be ready
	@kubectl wait --for=condition=available --timeout=300s deployment/aws-load-balancer-controller -n kube-system
	@sleep 10

	# Deploy Ingress with domain
	@cat Ingress.yaml.template | sed "s/\$${FULLDOMAINNAME}/$$(cat fullHostDomainName)/g" | sed "s|\$${CERT_ARN}|$$(cat certArn)|g" | kubectl apply -f -

	# Wait for ALB to be created
	@echo "Waiting for ALB..."
	@sleep 30

	# Create Route53 DNS record
	@ALB_DNS=$$(kubectl get ingress com619-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}') && \
	aws route53 change-resource-record-sets \
		--hosted-zone-id ${ROOT_HOSTEDZONE} \
		--change-batch "{ \"Changes\": [{ \"Action\": \"UPSERT\", \"ResourceRecordSet\": { \"Name\": \"$$(cat fullHostDomainName)\", \"Type\": \"CNAME\", \"TTL\": 300, \"ResourceRecords\": [{\"Value\": \"$$ALB_DNS\"}] } }] }"

	@echo "HTTPS endpoint will be available at: https://$$(cat fullHostDomainName)"

renewCert:
	# get new cert and key from certbot
	@python3 -m venv venv
	@. venv/bin/activate && python3 -m pip install -r requirements.txt

	@rm -rf certbot
	@mkdir certbot

	@echo "Renewing cert for `cat fullHostDomainName`"
	# Add the *. to ensure wildcard dns 
	@. venv/bin/activate && certbot certonly --dns-route53 \
					-d "*.`cat fullHostDomainName`" \
					--logs-dir=`pwd`/certbot \
					--work-dir=`pwd`/certbot \
					--config-dir=`pwd`/certbot \
					--email $(ADMIN_EMAIL_ADDRESS) \
					--agree-tos \
					--no-eff-email

undeployAll:
	# Undeploy EKS Cluster
	@aws cloudformation delete-stack --stack-name "${COM619_STACK_NAME}-CLUSTER"
	@aws cloudformation wait stack-delete-complete --stack-name "${COM619_STACK_NAME}-CLUSTER"

	# Undeploy VPC/Subnets/Networking
	@aws cloudformation delete-stack --stack-name "${COM619_STACK_NAME}-VPC"
	@aws cloudformation wait stack-delete-complete --stack-name "${COM619_STACK_NAME}-VPC"


