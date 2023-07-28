import { IConstruct } from 'constructs';
import { IRemoteVpnEndpoint, RemoteVpnEndpointConfiguration } from './remote-endpoint-base';
import { ICustomerGateway } from '../../customer-gateway';


/**
 * Specifies a remote VPN endpoint device that has its details configured in an
 * existing customer gateway.
 */
export class CustomerGatewayRemoteVpnEndpoint implements IRemoteVpnEndpoint {
  /**
   * The customer gateway that is configured with the details of the remote
   * endpoint device.
   *
   * @group Inputs
   */
  public readonly customerGateway: ICustomerGateway;


  /**
   * Creates a new instance of the CustomerGatewayRemoteVpnEndpoint class.
   *
   * @param customerGateway The customer gateway that is configured with the
   * details of the remote endpoint device.
   */
  public constructor(customerGateway: ICustomerGateway) {
    this.customerGateway = customerGateway;
  }

  /**
   * Produces a configuration that can be used when configuring the remote
   * end of a VPN connection.
   *
   * @param _scope The construct configuring the VPN connection that will be
   * referencing the remote endpoint.
   */
  bind(_scope: IConstruct): RemoteVpnEndpointConfiguration {
    return {
      customerGatewayAsn: this.customerGateway.customerGatewayAsn,
      customerGatewayId: this.customerGateway.customerGatewayId,
      customerGatewayIp: this.customerGateway.customerGatewayIp,
    };
  }
}
