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

## commands

this utility provides several 'sub-commands', specified as the first parameter following the utility command ( see examples below )

> NB: a note on output piping - in order to pipe 'clean' output to a subsequent tool such as `jq`, ensure you employ the _yarn_ `--silent` argument when calling the utility ( e.g `yarn --silent aws-utils some-command ....` )

### current

displays the currently configured tags for all components associated with the specified VPC.

```bash

yarn --silent aws-utils tag-vpc current \
    --tag-spec lib/commands/tag-vpc/sample-tagSpec.yml --vpc-id vpc-123456 | jq

```

### plan

displays the proposed tag change(s) to `plan` to a specified VPC in order to satisfy the supplied tag specification.

```bash
# view output formatted by jq
yarn --silent aws-utils tag-vpc plan \
    --vpc-id vpc-12345 \
    --tag-spec lib/commands/tag-vpc/sample-tagspec.yml | jq

# or more typically, dump output to file to be used by subsequent 'apply'
yarn --silent aws-utils tag-vpc plan \
    --vpc-id vpc-12345 \
    --tag-spec lib/commands/tag-vpc/sample-tagspec.yml > my-tagplan.json

```

### apply

given a tag plan produced by `plan`, applies the changes specified

```bash

yarn --silent aws-utils tag-vpc apply \
    --tag-plan ./your-snazzy-tagplan.json

```
