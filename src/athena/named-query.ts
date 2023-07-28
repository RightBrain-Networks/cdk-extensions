import { Names, Resource, ResourceProps } from 'aws-cdk-lib';
import { CfnNamedQuery } from 'aws-cdk-lib/aws-athena';
import { Construct } from 'constructs';
import { IWorkGroup } from '.';
import { Database } from '../glue';


/**
 * Configuration for a NamedQuery.
 */
export interface NamedQueryProps extends ResourceProps {
  /**
   * The Glue database to which the query belongs.
   *
   * @see [NamedQuery Database](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-database)
   */
  readonly database: Database;

  /**
   * A human friendly description explaining the functionality of the query.
   *
   * @see [NamedQuery Description](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-description)
   */
  readonly description?: string;

  /**
   * The name of the query.
   *
   * @see [NamedQuery Name](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-name)
   */
  readonly name?: string;

  /**
   * The SQL statements that make up the query.
   *
   * @see [NamedQuery QueryString](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-querystring)
   * @see [Athena SQL reference](https://docs.aws.amazon.com/athena/latest/ug/ddl-sql-reference.html)
   */
  readonly queryString: string;

  /**
   * The name of the workgroup that contains the named query.
   *
   * @see [NamedQuery WorkGroup](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-workgroup)
   * @see [Setting up workgroups](https://docs.aws.amazon.com/athena/latest/ug/workgroups-procedure.html)
   */
  readonly workGroup?: IWorkGroup;
}

export class NamedQuery extends Resource {
  /**
   * The Glue database to which the query belongs.
   *
   * @see [NamedQuery Database](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-database)
   *
   * @group Inputs
   */
  public readonly database: Database;

  /**
   * A human friendly description explaining the functionality of the query.
   *
   * @see [NamedQuery Description](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-description)
   *
   * @group Inputs
   */
  public readonly description?: string;

  /**
   * The name of the query.
   *
   * @see [NamedQuery Name](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-name)
   *
   * @group Inputs
   */
  public readonly name?: string;

  /**
   * The SQL statements that make up the query.
   *
   * @see [NamedQuery QueryString](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-querystring)
   * @see [Athena SQL reference](https://docs.aws.amazon.com/athena/latest/ug/ddl-sql-reference.html)
   *
   * @group Inputs
   */
  public readonly queryString: string;

  /**
   * The name of the workgroup that contains the named query.
   *
   * @see [NamedQuery WorkGroup](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-workgroup)
   * @see [Setting up workgroups](https://docs.aws.amazon.com/athena/latest/ug/workgroups-procedure.html)
   *
   * @group Inputs
   */
  readonly workGroup?: IWorkGroup;


  /**
   * The underlying NamedQuery CloudFormation resource.
   *
   * @see [AWS::Athena::NamedQuery](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html)
   *
   * @group Resources
   */
  public readonly resource: CfnNamedQuery;


  /**
     * The unique ID of the query.
     */
  public readonly namedQueryId: string;

  /**
     * The name of the query.
     */
  public readonly namedQueryName: string;


  /**
     * Creates a new instance of the NamedQuery class.
     *
     * @param scope A CDK Construct that will serve as this resource's parent in
     * the construct tree.
     * @param id A name to be associated with the stack and used in resource
     * naming. Must be unique within the context of 'scope'.
     * @param props Arguments related to the configuration of the resource.
     */
  constructor(scope: Construct, id: string, props: NamedQueryProps) {
    super(scope, id, props);

    this.database = props.database;
    this.description = props.description;
    this.name = props.name ?? Names.nodeUniqueId(this.node);
    this.queryString = props.queryString;
    this.workGroup = props.workGroup;

    this.resource = new CfnNamedQuery(this, 'Resource', {
      database: this.database.databaseName,
      description: this.description,
      name: this.name,
      queryString: this.queryString,
      workGroup: this.workGroup?.workGroupName,
    });

    this.namedQueryId = this.resource.attrNamedQueryId;
    this.namedQueryName = this.resource.ref;
  }
}
