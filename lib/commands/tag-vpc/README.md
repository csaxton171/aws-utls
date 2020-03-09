# tag-vpc

> allows the tag manipulation of all aws components associated with a specified VPC. useful when having to manually tag assets or in the case of just 'plan' mode, view the list of tags

## tag specification

in order to dictate tags to be applied to the various components associated with the vpc a yaml document is supplied stuctured like the following

```yaml
tags:
  - key: "SomeTag"
    value: "some-value"

  - key: "SomeTag2"
    value: "some-value2"
```

```bash

yarn aws-utils tag-vpc --vpc-id vpc-12345 --tag-spec lib/commands/tag-vpc/sample-tagSpec.yml

```
