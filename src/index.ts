import {
  Database,
  createEncodingLevelDB,
  DBOp,
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
    let toDeleteBlockNumber = 7216471;
    const lastBlockHash = await dbManager.numberToHash(new BN(7216470));
    while (true) {
      try {
        const block = await dbManager.getBlock(toDeleteBlockNumber++);
        dbOps.push(
          DBOp.del(DBTarget.HashToNumber, { blockHash: block.hash() }),
          DBOp.del(DBTarget.NumberToHash, {
            blockNumber: block.header.number,
          })
        );
      } catch (err) {
        if (err.type === "NotFoundError") {
          break;
        }
        throw err;
      }
    }
    dbOps.push(
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
