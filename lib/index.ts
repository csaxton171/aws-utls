import yargs from "yargs";
import dotenv from "dotenv";

dotenv.config();
yargs
  .scriptName("aws-utils")
  .usage("$0 <cmd> [args]")
  .commandDir("./commands", { extensions: ["ts"] })
  .wrap(120)
  .env("AWS_UTILS")
  .help().argv;
