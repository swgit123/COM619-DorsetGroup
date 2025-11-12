COM619_STACK_NAME := COM619
DEPLOYMENT_NAMESPACE := alex-university

deployCouchDB:
	@kubectl apply -f couchdb.yaml

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


