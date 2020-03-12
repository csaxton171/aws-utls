import { ELB } from "aws-sdk";
import { find, ifElse, isNil, compose, propEq, T, curry } from "rambdax";
import { prop, propOr } from "rambda";
import {
  GenericFilter,
  GenericTag,
  withAllPages,
  GenericTaggedResource
} from "./index";

export type TaggableElbResource = "ClassicLoadBalancer";

export const getElbClassicLoadBalancers = async (
  elb: ELB,
  filters: GenericFilter[]
) => {
  const functions = (await withAllPages(
    elb.describeLoadBalancers.bind(elb),
    {},
    { getToken: "NextMarker", setToken: "Marker" },
    propOr([], "LoadBalancerDescriptions")
  )) as ELB.LoadBalancerDescription[];

  const vpcFilter = compose(
    (fltr: GenericFilter | undefined) =>
      ifElse(isNil, T, onlyVpcFunctions(fltr!.Values)),
    find(propEq("Name", "vpc-id"))
  )(filters);

  return functions.filter(vpcFilter);
};

// TODO this could be made far more efficient ( batches of tag query max 20 per batch)
export const withElbClassicLoadBalancerTags = async (
  elb: ELB,
  resources: ELB.LoadBalancerDescription[]
) =>
  Promise.all(
    resources.map(async res => {
      const [tag] =
        (
          await elb
            .describeTags({
              LoadBalancerNames: [res.LoadBalancerName || ""]
            })
            .promise()
        ).TagDescriptions || [];

      return {
        ...res,
        tags: tag?.Tags ? (tag.Tags as GenericTag[]) : []
      } as ELB.LoadBalancerDescription & GenericTaggedResource;
    })
  );

const onlyVpcFunctions = curry(
  (vpcIds: string[], f: ELB.LoadBalancerDescription) =>
    vpcIds.includes(f.VPCId || "")
);
