import boto3
import functools
from botocore.exceptions import ClientError

boto3.session.Session(profile_name='audit-user')
boto3.setup_default_session(profile_name='audit-user')

ec2 = boto3.client('ec2')

####### Security Groups Info ################
'''
for region in ec2.describe_regions()['Regions']:
    client = boto3.client('ec2', region_name=region['RegionName'])
    response = client.describe_security_groups()
    if (response['ResponseMetadata'] and response['ResponseMetadata']['HTTPStatusCode'] == 200):
        for group in response['SecurityGroups']:
            print(group)
'''

####### EC2 Instances #######################
print('Region,Name,Security Group,Group ID')
for region in ec2.describe_regions()['Regions']:
    client = boto3.client('ec2', region_name=region['RegionName'])
    for reservation in client.describe_instances()['Reservations']:
        for instance in reservation['Instances']:
            tagName = [tag['Value']
                       for tag in instance['Tags'] if tag['Key'] == 'Name']
            if len(tagName) > 0:
                instInfo = functools.reduce(lambda acc, val: acc + val, tagName)
            else:
                instInfo = instance['VpcId']
            for group in instance['SecurityGroups']:
                groupInfo = region['RegionName'] + ',' + instInfo + ',' + \
                    group['GroupName'] + '(' + group['GroupId'] + ')'
                print(groupInfo)

# S3 Buckets ########################
'''
for region in ec2.describe_regions()['Regions']:
    client = boto3.client('s3', region_name=region['RegionName'])
    response = client.list_buckets()
    print(response)
'''

######## RDS ########################
print('Region,Name,VPC Security Group ID')
for region in ec2.describe_regions()['Regions']:
    client = boto3.client('rds', region_name=region['RegionName'])
    response = client.describe_db_instances()
    for instance in response['DBInstances']:
            count = len(instance['VpcSecurityGroups'])
            if count > 1:
                SecGrp = functools.reduce(
                    lambda a, b: a['VpcSecurityGroupId'] + ',' + b['VpcSecurityGroupId'], instance['VpcSecurityGroups'])
            elif count == 1:
                SecGrp = instance['VpcSecurityGroups'][0]['VpcSecurityGroupId']
            info = instance['AvailabilityZone'] + ',' + \
                instance['DBInstanceIdentifier'] + ',' + SecGrp
            print(info)

############ ELB ############################
print('Region,Name,Security Group')
for region in ec2.describe_regions()['Regions']:
    client = boto3.client('elb', region_name=region['RegionName'])
    for elb in client.describe_load_balancers()['LoadBalancerDescriptions']:
        count = len(elb['SecurityGroups'])
        if count > 1:
                SecGrps = functools.reduce(lambda a, b: a + ',' + b, elb['SecurityGroups'])
        elif count == 1:
                SecGrps = elb['SecurityGroups'][0]
        else:
                SecGrps = ''
        for zone in elb['AvailabilityZones']:
                info = zone + ',' + elb['LoadBalancerName'] + ',' + SecGrps
                print(info)

############ ELBv2 ############################
print('Region,Name,Security Group')
for region in ec2.describe_regions()['Regions']:
    client = boto3.client('elbv2', region_name=region['RegionName'])
    for elb in client.describe_load_balancers()['LoadBalancers']:
        count = len(elb['SecurityGroups'])
        if count > 1:
                SecGrps = functools.reduce(lambda a, b: a + '|' + b, elb['SecurityGroups'])
        elif count == 1:
                SecGrps = elb['SecurityGroups'][0]
        else:
                SecGrps = ''
        for zone in elb['AvailabilityZones']:
                info = zone['ZoneName'] + ',' + elb['LoadBalancerName'] + ',' + SecGrps
                print(info)
