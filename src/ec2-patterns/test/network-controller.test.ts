import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { NetworkController } from '../network-controller';


const defaultAccount = '123456789012';
const defaultRegion = 'us-east-1';

test('network controller should have standard defaults', () => {
  const resources = getCommonResources();
  const stack = resources.stack;

  new NetworkController(stack, 'network-controller');

  const template = Template.fromStack(stack);

  const expectedRegions = [
    'ap-northeast-1',
    'ap-northeast-2',
    'ap-northeast-3',
    'ap-south-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ca-central-1',
    'eu-central-1',
    'eu-north-1',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'sa-east-1',
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
  ];

  template.hasResourceProperties('AWS::NetworkManager::GlobalNetwork', {});
  template.hasResourceProperties('AWS::EC2::IPAM', {
    Description: 'Global IP address manager.',
    OperatingRegions: expectedRegions.map((x) => {
      return {
        RegionName: x,
      };
    }),
  });
});

test('adding a hub network should create one with sane defaults', () => {
  const resources = getCommonResources();
  const app = resources.app;
  const controllerStack = resources.stack;
  const hubStack = createStack(app, 'hub-stack', defaultAccount, defaultRegion);

  const controller = new NetworkController(controllerStack, 'network-controller');
  controller.addHub(hubStack, 'hub');

  const template = Template.fromStack(hubStack);

  template.hasResourceProperties('AWS::EC2::VPC', {
    EnableDnsHostnames: true,
    EnableDnsSupport: true,
    InstanceTenancy: 'default',
    Ipv4IpamPoolId: Match.anyValue(),
    Ipv4NetmaskLength: 16,
  });
});

test('adding a spoke in the same account should create one with sane defaults and configure networking', () => {
  const resources = getCommonResources();
  const app = resources.app;
  const controllerStack = resources.stack;
  const hubStack = createStack(app, 'hub-stack', defaultAccount, defaultRegion);
  const spokeStack = createStack(app, 'spoke-stack', defaultAccount, defaultRegion);

  const controller = new NetworkController(controllerStack, 'network-controller');
  const hub = controller.addHub(hubStack, 'hub');
  const spoke = hub.addSpoke(spokeStack, 'spoke-stack');

  const hubTemplate = Template.fromStack(hubStack);
  const spokeTemplate = Template.fromStack(spokeStack);

  hubTemplate.hasResourceProperties('AWS::EC2::TransitGateway', {
    AutoAcceptSharedAttachments: 'enable',
    DefaultRouteTableAssociation: 'enable',
    DefaultRouteTablePropagation: 'enable',
    DnsSupport: 'enable',
    MulticastSupport: 'disable',
    VpnEcmpSupport: 'disable',
  });

  hubTemplate.hasResourceProperties('AWS::EC2::TransitGatewayAttachment', {
    SubnetIds: hubStack.resolve(hub.selectSubnets({
      onePerAz: true,
      subnetGroupName: 'dmz',
    }).subnetIds),
    TransitGatewayId: hubStack.resolve(hub.transitGateway?.transitGatewayId),
    VpcId: hubStack.resolve(hub.vpcId),
  });

  spokeTemplate.hasResourceProperties('AWS::EC2::TransitGatewayAttachment', {
    SubnetIds: spokeStack.resolve(spoke.selectSubnets({
      onePerAz: true,
      subnetGroupName: 'dmz',
    }).subnetIds),
    TransitGatewayId: spokeStack.resolve(hub.transitGateway?.transitGatewayId),
    VpcId: spokeStack.resolve(spoke.vpcId),
  });

  spokeTemplate.hasResourceProperties('AWS::EC2::VPC', {
    EnableDnsHostnames: true,
    EnableDnsSupport: true,
    InstanceTenancy: 'default',
    Ipv4IpamPoolId: Match.anyValue(),
    Ipv4NetmaskLength: 16,
  });
});

function createStack(app: App, id: string, account: string, region: string): Stack {
  return new Stack(app, id, {
    env: {
      account,
      region,
    },
  });
}

function getCommonResources() {
  const app = new App();
  const stack = createStack(app, 'stack', defaultAccount, defaultRegion);

  return {
    app,
    stack,
  };
}