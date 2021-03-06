const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const studentAccountTable = process.env.StudentAccountTable;


const stopStudentInstance = async(param) => {
    const { roleArn, stackName , accessKeyId, secretAccessKey } = param;

    let credentials = {
        accessKeyId,
        secretAccessKey,
        region: "us-east-1"
    };
    if (!accessKeyId) {
        const sts = new AWS.STS();
        const token = await sts.assumeRole({
            RoleArn: roleArn,
            RoleSessionName: 'studentAccount'
        }).promise();
        credentials = {
            accessKeyId: token.Credentials.AccessKeyId,
            secretAccessKey: token.Credentials.SecretAccessKey,
            sessionToken: token.Credentials.SessionToken,
            region: "us-east-1"
        };
    }
    
    const cloudformation = new AWS.CloudFormation(credentials);
    let response = await cloudformation.describeStackResources({
        StackName: stackName
    }).promise();
    const instanceIds = response.StackResources.filter(c => c.ResourceType === "AWS::EC2::Instance").map(c => c.PhysicalResourceId);
    console.log(instanceIds);

    const ec2 = new AWS.EC2(credentials);

    response = await ec2.stopInstances({
        InstanceIds: instanceIds
    }).promise();
    console.log(response);
};

exports.lambdaHandler = async(event, context) => {
    console.log(event);
    let { classroomName, stackName, email } = event;

    let studentAccount = await dynamo.get({
        TableName: studentAccountTable,
        Key: {
            'classroomName': classroomName,
            'email': email
        }
    }).promise();
    console.log(studentAccount);

    const awsAccountId = context.invokedFunctionArn.split(":")[4];
    const param = {
        stackName,
        roleArn: `arn:aws:iam::${studentAccount.Item.awsAccountId}:role/crossaccountteacher${awsAccountId}`,
        accessKeyId: studentAccount.Item.accessKeyId,
        secretAccessKey: studentAccount.Item.secretAccessKey,
    };
    await stopStudentInstance(param);
    return "OK";
};
