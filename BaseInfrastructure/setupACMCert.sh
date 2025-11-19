#!/bin/bash
# Request ACM certificate
DOMAIN=$(cat fullHostDomainName)
CERT_ARN=$(aws acm request-certificate \
  --domain-name "$DOMAIN" \
  --validation-method DNS \
  --region eu-west-2 \
  --query CertificateArn \
  --output text)

echo "Certificate ARN: $CERT_ARN"
echo "$CERT_ARN" > certArn

# Get validation record
sleep 5
aws acm describe-certificate --certificate-arn "$CERT_ARN" --region eu-west-2 \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
  --output json > validation.json

# Create Route53 validation record
RECORD_NAME=$(jq -r '.Name' validation.json)
RECORD_VALUE=$(jq -r '.Value' validation.json)

aws route53 change-resource-record-sets \
  --hosted-zone-id Z1RHXN9JVNRIMU \
  --change-batch "{
    \"Changes\": [{
      \"Action\": \"UPSERT\",
      \"ResourceRecordSet\": {
        \"Name\": \"$RECORD_NAME\",
        \"Type\": \"CNAME\",
        \"TTL\": 300,
        \"ResourceRecords\": [{\"Value\": \"$RECORD_VALUE\"}]
      }
    }]
  }"

echo "Waiting for certificate validation..."
aws acm wait certificate-validated --certificate-arn "$CERT_ARN" --region eu-west-2
echo "Certificate validated!"
