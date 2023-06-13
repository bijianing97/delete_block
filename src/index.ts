import {
  Database,
  createEncodingLevelDB,
  DBOp,
  DBTarget,
} from "@rei-network/database";
import { Common } from "@rei-network/common";
import { BN } from "ethereumjs-util";

async function main() {
  const lastBlockNumber = Number(
    process.argv[process.argv.indexOf("--last-block-number") + 1]
  );
  const datadirList =
    process.argv[process.argv.indexOf("--datadir") + 1].split(",");
  const lastBlockNumberBN = new BN(lastBlockNumber);
  const confirmsBlockNumber = 256;
  const bloomBitsSectionSize = 4096;
  const common = new Common({ chain: "rei-testnet" });
  try {
    for (const datadir of datadirList) {
      const db = createEncodingLevelDB(datadir)[0];
      const dbManager = new Database(db, common);
      const dbOps: DBOp[] = [];
      let toDeleteBlockNumber = lastBlockNumber + 1;
      const lastBlockHash = await dbManager.numberToHash(
        new BN(lastBlockNumber)
      );
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
      let currentSections: BN | undefined = lastBlockNumberBN.gtn(
        confirmsBlockNumber
      )
        ? lastBlockNumberBN.subn(confirmsBlockNumber).divn(bloomBitsSectionSize)
        : undefined;
      currentSections = currentSections.gtn(0)
        ? currentSections.subn(1)
        : undefined;
      if (currentSections) {
        DBOp.set(DBTarget.BloomBitsSectionCount, currentSections);
      }
      dbOps.push(
        DBOp.set(DBTarget.HeadHeader, lastBlockHash),
        DBOp.set(DBTarget.HeadBlock, lastBlockHash)
      );

      await dbManager.batch(dbOps);
      console.log(`datadir ${datadir} finished`);
    }
  } catch (err) {
    console.log(err);
  }
}

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
