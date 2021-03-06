ClassroomBucket=$(aws cloudformation describe-stacks --stack-name managed-aws-educate-classroom \
--query 'Stacks[0].Outputs[?OutputKey==`ClassroomBucket`].OutputValue' --output text)

sed "s/###bucket###/$ClassroomBucket/g" CreateClassroomTemplate.json > CreateClassroom.json

aws s3 sync ../cloudformation s3://$ClassroomBucket