import { partial } from "rambdax";

export const noArn = () => undefined;

export const toArn = <T>(
  service: string,
  region: string,
  account: string,
  resourceType: string,
  getResourceId: (subject: T) => string
) => (subject: T) => {
  const resourceId = getResourceId(subject);
  const resDelim = /[\/:]{1}$/m.test(resourceType) ? "" : "/"; //because elasticache does things differently...
  return `arn:aws:${service}:${region}:${account}:${resourceType}${resDelim}${resourceId}`;
};

export const toEc2Arn = partial(toArn, "ec2");
