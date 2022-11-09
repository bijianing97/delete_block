import {
  Database,
  createEncodingLevelDB,
  DBOp,
  DBSetTD,
  DBTarget,
} from "@rei-network/database";
import { Common } from "@rei-network/common";
import { datadirs } from "./config";
import { BN } from "ethereumjs-util";

async function main() {
  const common = new Common({ chain: "rei-testnet" });
  for (const datadir of datadirs) {
    const db = createEncodingLevelDB(datadir)[0];
    const dbManager = new Database(db, common);
    const dbOps: DBOp[] = [];
    const toDeleteBlock = await dbManager.getBlock(7387545);
    const lastBlockHash = await dbManager.numberToHash(new BN(7387544));
    dbOps.push(
      DBOp.del(DBTarget.HashToNumber, { blockHash: toDeleteBlock.hash() }),
      DBOp.del(DBTarget.NumberToHash, {
        blockNumber: toDeleteBlock.header.number,
      }),
      DBOp.set(DBTarget.HeadHeader, lastBlockHash),
      DBOp.set(DBTarget.HeadBlock, lastBlockHash)
    );

    await dbManager.batch(dbOps);
    console.log("finished");
  }
}

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
