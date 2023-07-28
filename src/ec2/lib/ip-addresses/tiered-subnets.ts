import { Fn } from 'aws-cdk-lib';
import { AllocateCidrRequest, IIpAddresses, SubnetIpamOptions, VpcIpamOptions } from 'aws-cdk-lib/aws-ec2';
import { IIpamPool } from '../..';
import { divideCidr, getBiggestMask } from '../../../utils/networking';
import { IIpv4CidrAssignment } from '../cidr-assignment';


export interface TieredSubnetsOptions {
  readonly provider: IIpv4CidrAssignment;
  readonly tierMask?: number;
}

export class TieredSubnets implements IIpAddresses {
  public readonly ipamOptions: VpcIpamOptions;
  public readonly ipamPool?: IIpamPool;
  public readonly netmask: number;
  public readonly tierMask?: number;

  public constructor(options: TieredSubnetsOptions) {
    const config = options.provider.getCidrOrIpamConfiguration({});

    if (config.cidrDetails) {
      this.ipamOptions = {
        cidrBlock: config.cidrDetails.cidr,
      };

      this.netmask = config.cidrDetails.netmask;
    } else if (config.ipamDetails) {
      this.ipamOptions = {
        ipv4IpamPoolId: config.ipamDetails.ipamPool?.ipamPoolId,
        ipv4NetmaskLength: config.ipamDetails.netmask,
      };

      this.ipamPool = config.ipamDetails.ipamPool;
      this.netmask = config.ipamDetails.netmask;
    } else {
      throw new Error([
        'Provided CIDR assignment failed to provide either CIDR or IPAM',
        'details when building tiered subnets.',
      ].join(' '));
    }

    this.tierMask = options.tierMask;
  }

  public allocateVpcCidr(): VpcIpamOptions {
    return this.ipamOptions;
  }

  public allocateSubnetsCidr(input: AllocateCidrRequest): SubnetIpamOptions {
    if (this.ipamOptions.cidrBlock) {
      return this.allocateSubnetsCidrNoIpam(input);
    } else {
      return this.allocateSubnetsCidrIpam(input);
    }
  }

  private allocateSubnetsCidrIpam(input: AllocateCidrRequest): SubnetIpamOptions {
    const tiers = Array.from(new Set<string>(input.requestedSubnets.map((x) => {
      return x.configuration.name;
    })));

    const azs = Array.from(new Set<string>(input.requestedSubnets.map((x) => {
      return x.availabilityZone;
    })));

    if (this.ipamOptions.ipv4NetmaskLength === undefined) {
      throw new Error([
        'When creating tiered subnets using IPAM an explicit netmask must be',
        'provided.',
      ].join(' '));
    }

    const networkMap: {[tier: string]: {[az: string]: string}} = {};
    const biggestMaskTier = getBiggestMask(this.ipamOptions.ipv4NetmaskLength, tiers.length);

    if (this.tierMask && this.tierMask > biggestMaskTier) {
      throw new Error([
        `Provided tier mask '${this.tierMask}' is larger that the largest`,
        `supported netmask '${biggestMaskTier}'.`,
      ].join(' '));
    }

    const effectiveTierMask = this.tierMask ?? biggestMaskTier;
    const tierNetworks = Fn.cidr(input.vpcCidr, tiers.length, `${32 - effectiveTierMask}`);

    tiers.forEach((tier, tIdx) => {
      networkMap[tier] = {};

      const tierNetwork = Fn.select(tIdx, tierNetworks);
      const tierSubnets = input.requestedSubnets.filter((x) => {
        return x.configuration.name === tier;
      });

      const subnetMask = Array.from(new Set(tierSubnets.map((x) => {
        return x.configuration.cidrMask;
      })));
      const biggestSubnetMask = getBiggestMask(effectiveTierMask, tierSubnets.length);

      if (subnetMask.length > 1) {
        throw new Error([
          'When specifying a custom subnet CidrMask for tiered',
          'subnets all subnets in the same tier must share the have',
          'the same CidrMask.',
        ].join(' '));
      } else if (subnetMask[0] && subnetMask[0] > biggestSubnetMask) {
        throw new Error([
          `Provided subnet mask '${subnetMask[0]}' is larger that the largest`,
          `supported netmask '${biggestSubnetMask}'.`,
        ].join(' '));
      }

      const effectiveSubnetMask = subnetMask[0] ?? biggestSubnetMask;
      const subnetNetworks = Fn.cidr(tierNetwork, tierSubnets.length, `${32 - effectiveSubnetMask}`);

      azs.forEach((az, azIdx) => {
        networkMap[tier][az] = Fn.select(azIdx, subnetNetworks);
      });
    });

    return {
      allocatedSubnets: input.requestedSubnets.map((x) => {
        return {
          cidr: networkMap[x.configuration.name][x.availabilityZone],
        };
      }),
    };
  }

  private allocateSubnetsCidrNoIpam(input: AllocateCidrRequest): SubnetIpamOptions {
    const tiers = Array.from(new Set<string>(input.requestedSubnets.map((x) => {
      return x.configuration.name;
    })));

    const azs = Array.from(new Set<string>(input.requestedSubnets.map((x) => {
      return x.availabilityZone;
    })));

    const networkMap: {[tier: string]: {[az: string]: string}} = {};
    const tierNetworks = divideCidr(input.vpcCidr, tiers.length, this.tierMask);
    tiers.forEach((tier, tIdx) => {
      networkMap[tier] = {};

      const tierSubnets = input.requestedSubnets.filter((x) => {
        return x.configuration.name === tier;
      });

      const maskBits = Array.from(new Set(tierSubnets.map((x) => {
        return x.configuration.cidrMask;
      })));

      if (maskBits.length > 1) {
        throw new Error([
          'When specifying a custom subnet CidrMask for tiered',
          'subnets all subnets in the same tier must share the have',
          'the same CidrMask.',
        ].join(' '));
      }

      const azNetworks = divideCidr(tierNetworks[tIdx], azs.length, maskBits[0]);
      azs.forEach((az, azIdx) => {
        networkMap[tier][az] = azNetworks[azIdx];
      });
    });

    return {
      allocatedSubnets: input.requestedSubnets.map((x) => {
        return {
          cidr: networkMap[x.configuration.name][x.availabilityZone],
        };
      }),
    };
  }
}
