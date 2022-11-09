import {
  Database,
  createEncodingLevelDB,
  DBOp,
  DBSetTD,
  DBTarget,
} from "@rei-network/database";
import { Common } from "@rei-network/common";
import { datadirs } from "./config";

async function main() {
  const common = new Common({ chain: "rei-testnet" });
  for (const datadir of datadirs) {
    const db = createEncodingLevelDB(datadir)[0];
    const dbManager = new Database(db, common);
    const dbOps: DBOp[] = [];
    const toDeleteBlock = await dbManager.getBlock(7387545);
    const lastBlock = await dbManager.getBlock(7387544);
    const heads = await dbManager.getHeads();
    dbOps.push(
      DBOp.del(DBTarget.HashToNumber, { blockHash: toDeleteBlock.hash() }),
      DBOp.del(DBTarget.NumberToHash, {
        blockNumber: toDeleteBlock.header.number,
      }),
      DBOp.set(DBTarget.HeadHeader, lastBlock.hash()),
      DBOp.set(DBTarget.HeadBlock, lastBlock.hash())
    );

    await dbManager.batch(dbOps);
  }
}

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
