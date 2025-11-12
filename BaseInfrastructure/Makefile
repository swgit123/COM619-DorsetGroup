COM619_STACK_NAME := COM619
DEPLOYMENT_NAMESPACE := alex-university

deployCouchDB:
	@kubectl apply -f couchdb.yaml

deployApp:
	@kubectl apply -f com619.yaml

undeployApp:
	@kubectl delete -f com619.yaml

buildApp:
	# First we need to create the ECR or check if it exists
	@aws ecr create-repository --repository-name com619app --region eu-west-2 || true

	# Need to authenticate ourselves to ECR
	@aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin 114788392298.dkr.ecr.eu-west-2.amazonaws.com

	# now build image
	@cd ../frontend && docker build -t com619app .
	@docker tag com619app:latest 114788392298.dkr.ecr.eu-west-2.amazonaws.com/com619app:latest
	@docker push 114788392298.dkr.ecr.eu-west-2.amazonaws.com/com619app:latest

deployAll:
	# Deploy VPC/Subnets/Networking
	@aws cloudformation deploy --no-fail-on-empty-changeset --template-file eks-vpc-private-subnets.yaml \
		--stack-name "${COM619_STACK_NAME}-VPC" \
		--capabilities CAPABILITY_NAMED_IAM \
		--tags "user:deployment=${DEPLOYMENT_NAMESPACE}"

	# Deploy EKS Cluster
	@aws cloudformation deploy --no-fail-on-empty-changeset --template-file EKSCluster.yaml \
		--stack-name "${COM619_STACK_NAME}-CLUSTER" \
		--capabilities CAPABILITY_NAMED_IAM \
		--tags "user:deployment=${DEPLOYMENT_NAMESPACE}"

	# Now that VPC & EKS is deployed we need to deploy our database
	


undeployAll:
	# Undeploy EKS Cluster
	@aws cloudformation delete-stack --stack-name "${COM619_STACK_NAME}-CLUSTER"
	@aws cloudformation wait stack-delete-complete --stack-name "${COM619_STACK_NAME}-CLUSTER"

	# Undeploy VPC/Subnets/Networking
	@aws cloudformation delete-stack --stack-name "${COM619_STACK_NAME}-VPC"
	@aws cloudformation wait stack-delete-complete --stack-name "${COM619_STACK_NAME}-VPC"


